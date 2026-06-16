# Harness — Agente n8n: Follow-up de Adoção ONG
# Spec: ong-module | Pilar: Harness Engineering

---

## Propósito

Automatizar os lembretes de follow-up pós-adoção para as ONGs do SOS Pet Aumigo.
Sem este agente, as ONGs precisam lembrar manualmente de contactar adotantes
em 30 e 90 dias — e frequentemente esquecem.

**Gatilho:** Webhook disparado pelo `createAdoption` Server Action.
**Saída:** Mensagem WhatsApp para a ONG no dia do follow-up.

---

## Arquitetura do Harness

```
createAdoption (Next.js Server Action)
        │
        │ POST webhook (payload abaixo)
        ▼
   n8n Webhook Trigger
        │
        ├─► [Phase Gate 1] Validar payload com JSON Schema
        │       Falha? → Log de erro + parar (não criar lembretes corrompidos)
        │
        ├─► [Nó: Criar lembrete 30 dias]
        │       Agendar execução para adoption_date + 30 dias
        │       INSERT em webhook_logs (rastreabilidade)
        │
        ├─► [Nó: Criar lembrete 90 dias]
        │       Agendar execução para adoption_date + 90 dias
        │
        └─► [Resposta 200] { success: true, scheduled: ["30d","90d"] }


[No dia do follow-up — CRON ou Schedule Trigger]:
        │
        ├─► Buscar adoções com follow-up pendente (Supabase REST)
        ├─► Para cada adoção:
        │       │
        │       ├─► [Phase Gate 2] Follow-up já foi registrado?
        │       │       Sim? → pular (idempotência)
        │       │
        │       └─► Enviar WhatsApp para ONG
        │               "Olá! Passou 30 dias da adoção de [Pet]. Tudo bem? 🐾"
        │
        └─► Log de execução no Supabase
```

---

## Payload do Webhook (Next.js → n8n)

```json
{
  "event": "adoption.created",
  "adoption": {
    "id": "uuid",
    "adoption_date": "2026-06-01",
    "adopter_name": "Maria Silva",
    "adopter_phone": "13999990000",
    "adopter_city": "Santos"
  },
  "pet": {
    "id": "uuid",
    "name": "Bolinha",
    "species": "dog",
    "breed": "SRD"
  },
  "shelter": {
    "id": "uuid",
    "name": "ONG Patinhas de Santos",
    "phone": "13988880000"
  }
}
```

**JSON Schema para validação no n8n:**

```json
{
  "type": "object",
  "required": ["event", "adoption", "pet", "shelter"],
  "properties": {
    "event": { "type": "string", "enum": ["adoption.created"] },
    "adoption": {
      "type": "object",
      "required": ["id", "adoption_date", "adopter_name", "adopter_phone"],
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "adoption_date": { "type": "string", "format": "date" },
        "adopter_name": { "type": "string" },
        "adopter_phone": { "type": "string" }
      }
    },
    "pet": {
      "type": "object",
      "required": ["id", "species"],
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "name": { "type": "string" },
        "species": { "type": "string" }
      }
    },
    "shelter": {
      "type": "object",
      "required": ["id", "phone"],
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "phone": { "type": "string" },
        "name": { "type": "string" }
      }
    }
  }
}
```

---

## System Message do Agente (blindada anti-alucinação)

```
Você é o assistente de follow-up de adoções da plataforma SOS Pet Aumigo.

## Identidade
Você auxilia ONGs e protetores da Baixada Santista a acompanhar o
bem-estar de pets adotados. Você NÃO é um assistente geral.

## Função
Quando acionado, você:
1. Verifica se o follow-up deste período (30 ou 90 dias) já foi registrado
2. Se não foi, envia lembrete via WhatsApp para a ONG/protetor
3. Registra o envio no banco para evitar duplicação

## Mensagens de follow-up

**30 dias:**
"🐾 Olá, [SHELTER_NAME]! Passou 1 mês desde a adoção de [PET_NAME] por [ADOPTER_NAME].
Tudo bem com o [ele/ela]? Se precisar de apoio ou tiver alguma dúvida, estamos aqui. 💛"

**90 dias:**
"🐾 Olá, [SHELTER_NAME]! Já faz 3 meses que [PET_NAME] encontrou um lar com [ADOPTER_NAME].
Como está sendo a experiência? Qualquer novidade, pode chamar! 🐕"

## REGRAS ABSOLUTAS
- NUNCA inventar dados. Se o payload não tiver nome do pet, usar "o pet adotado".
- NUNCA enviar follow-up se já existe registro de envio para este adoption_id + período.
- NUNCA mudar o status da adoção no banco (isso é responsabilidade da ONG via sistema).
- NUNCA expor dados de contato do adotante para terceiros.
- Se qualquer tool retornar erro, registre o erro e PARE. Não tente alternativas.

## Ferramentas disponíveis
- buscar_follow_up_pendente: verifica se já foi enviado
- registrar_envio: marca o follow-up como enviado
- enviar_whatsapp: envia mensagem via WhatsApp Business API
```

---

## Configuração dos Nós n8n

### Nó 1: Webhook Trigger
```yaml
method: POST
path: /ong/adoption-created
authentication: Header Auth
  header: X-SOS-Secret
  value: {{ $env.N8N_WEBHOOK_SECRET }}
response:
  mode: lastNode
```

### Nó 2: Validar Payload (Code Node)
```javascript
// Valida campos obrigatórios antes de prosseguir
const body = $input.first().json;
const required = ['adoption', 'pet', 'shelter'];
for (const field of required) {
  if (!body[field]) {
    throw new Error(`Campo obrigatório ausente: ${field}`);
  }
}
if (!body.adoption.id || !body.adoption.adoption_date) {
  throw new Error('adoption.id e adoption.adoption_date são obrigatórios');
}
return [{ json: body }];
```

### Nó 3: Agendar Follow-ups (Schedule)
Calcular datas de execução:
- `follow_up_30`: `adoption_date + 30 dias` às 09:00
- `follow_up_90`: `adoption_date + 90 dias` às 09:00

### Nó 4: HTTP Tool — buscar_follow_up_pendente
```
GET {SUPABASE_URL}/rest/v1/adoptions
  ?id=eq.{adoption_id}
  &select=id,follow_up_30_date,follow_up_90_date,status
Headers:
  apikey: {SUPABASE_ANON_KEY}
  Authorization: Bearer {SUPABASE_ANON_KEY}
```

### Nó 5: HTTP Tool — registrar_envio
```
PATCH {SUPABASE_URL}/rest/v1/adoptions
  ?id=eq.{adoption_id}
Headers:
  apikey: {SUPABASE_SERVICE_ROLE_KEY}  ← service_role apenas no n8n, nunca no frontend
Body (30 dias):
  { "follow_up_30_date": "{hoje}" }
Body (90 dias):
  { "follow_up_90_date": "{hoje}" }
```

---

## Phase Gates

### Gate 1 — Payload válido? (antes de qualquer action)
```
adoption.id presente?         → prosseguir
adoption.adoption_date válida? → prosseguir
shelter.phone presente?        → prosseguir
qualquer falha?                → log erro + retornar 400
```

### Gate 2 — Follow-up já enviado? (antes de enviar WhatsApp)
```
follow_up_30_date já preenchida? → pular lembrete 30d (idempotência)
follow_up_90_date já preenchida? → pular lembrete 90d
```

### Gate 3 — WhatsApp enviado com sucesso?
```
status 200?   → registrar_envio no banco
status != 200 → log de falha + NÃO registrar (retry na próxima execução)
```

---

## Código para disparar o webhook (Server Action)

Adicionar ao final de `createAdoption` em `app/ong/adocoes/actions.ts`,
após a adoção ser criada com sucesso:

```typescript
// Dispara webhook n8n — falha silenciosa (não bloqueia o usuário)
const webhookUrl = process.env.N8N_ONG_ADOPTION_WEBHOOK_URL;
if (webhookUrl) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SOS-Secret': process.env.N8N_WEBHOOK_SECRET ?? '',
      },
      body: JSON.stringify({
        event: 'adoption.created',
        adoption: {
          id: parsed.data.pet_id, // usar adoption.id após insert
          adoption_date: parsed.data.adoption_date,
          adopter_name: parsed.data.adopter_name,
          adopter_phone: parsed.data.adopter_phone,
          adopter_city: parsed.data.adopter_city,
        },
        pet: { id: parsed.data.pet_id, name: petData?.name, species: petData?.species },
        shelter: { id: shelter.id, name: shelterData?.name, phone: shelterData?.phone },
      }),
    });
  } catch {
    // Log sem bloquear — adoção já foi criada
    console.error('[n8n webhook] Falha ao disparar adoption.created');
  }
}
```

**Variáveis de ambiente a adicionar:**
```
N8N_ONG_ADOPTION_WEBHOOK_URL=https://n8n.aumigo.com.br/webhook/ong/adoption-created
N8N_WEBHOOK_SECRET=gerar_com_openssl_rand_hex_32
```

---

## Rastreabilidade — tabela webhook_logs (opcional mas recomendado)

```sql
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event      TEXT NOT NULL,
  payload    JSONB NOT NULL,
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  error      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Sem RLS: apenas service_role acessa (n8n)
-- Sem dados de usuários — apenas eventos de sistema
```

---

## Checklist de deploy do harness n8n

- [ ] Webhook URL configurada em `.env.local` e Vercel
- [ ] `N8N_WEBHOOK_SECRET` igual nos dois lados (Next.js e n8n)
- [ ] Nó de validação de payload ativo
- [ ] Phase Gate 2 (idempotência) testado: enviar 2x, confirmar 1 disparo
- [ ] WhatsApp Business API configurada no n8n
- [ ] Teste end-to-end: criar adoção → ver webhook no n8n → ver mensagem WhatsApp
