# Tasks — Notificações via n8n
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md, CLAUDE.md — Agentes planejados

---

## T1 — Migration SQL: `notification_subscriptions` e `notification_logs`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `supabase/migrations/20260610_notifications.sql` (novo)

### Especificação EARS
THE SYSTEM SHALL criar tabelas de controle de assinaturas e logs de notificação com RLS.

### O que fazer
1. Criar `notification_subscriptions`:
   - `id UUID PK DEFAULT gen_random_uuid()`
   - `user_id UUID → auth.users(id) ON DELETE CASCADE NOT NULL`
   - `city TEXT NOT NULL`
   - `channel TEXT CHECK IN ('whatsapp', 'email') NOT NULL`
   - `active BOOLEAN DEFAULT TRUE`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - UNIQUE constraint em `(user_id, city, channel)`
2. Criar `notification_logs`:
   - `id UUID PK DEFAULT gen_random_uuid()`
   - `pet_id UUID → pets(id) ON DELETE CASCADE NOT NULL`
   - `user_id UUID` (nullable — para status 'no_recipients')
   - `channel TEXT CHECK IN ('whatsapp', 'email', 'system')`
   - `status TEXT CHECK IN ('sent', 'failed', 'no_recipients', 'rate_limited') NOT NULL`
   - `error_message TEXT`
   - `sent_at TIMESTAMPTZ DEFAULT NOW()`
3. ENABLE ROW LEVEL SECURITY em ambas
4. Políticas:
   - `notification_subscriptions`: SELECT/INSERT/UPDATE WHERE auth.uid() = user_id
   - `notification_logs`: INSERT via service_role apenas; SELECT para o dono do pet (`auth.uid() = (SELECT owner_id FROM pets WHERE id = pet_id)`)
5. Índices: `(user_id, active)` em subscriptions; `(pet_id, user_id)` em logs; `(pet_id, status)` em logs

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] Migration idempotente
- [ ] UNIQUE constraint em `(user_id, city, channel)` em subscriptions
- [ ] RLS impede usuário A de ver assinaturas do usuário B
- [ ] SELECT em notification_logs retorna apenas logs dos pets do usuário logado

---

## T2 — API Route: gerenciar assinaturas de notificação

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/api/notifications/subscriptions/route.ts` (novo)

### Especificação EARS
WHEN usuário ativa alertas com `city` e `channel`
THE SYSTEM SHALL fazer UPSERT em `notification_subscriptions` com `active = true`.

### O que fazer
1. `GET`: retornar assinaturas ativas do usuário logado
2. `POST`: body `{ city, channel }` validado com Zod; verificar se canal é 'whatsapp' e usuário tem telefone no perfil; UPSERT com `onConflict: 'user_id,city,channel'` setando `active = true`
3. `DELETE`: body `{ id }` — setar `active = false` (soft delete)
4. Verificar autenticação; retornar 401 se não autenticado
5. Rate limiting: `checkRateLimit` com chave `notif-sub:{userId}` (10 req/min)

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `POST` sem autenticação retorna 401
- [ ] `POST` com `channel = 'whatsapp'` e sem telefone no perfil retorna 422 com mensagem clara
- [ ] UPSERT não cria duplicatas (idempotente)
- [ ] `DELETE` apenas desativa, não remove o registro

---

## T3 — Webhook endpoint para n8n: `/api/webhooks/pet-lost`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/api/webhooks/pet-lost/route.ts` (novo)

### Especificação EARS
WHEN INSERT em `pets` com `kind = 'lost'` ocorre no Supabase
THE SYSTEM SHALL receber o evento e disparar o workflow n8n.

### O que fazer
1. Endpoint `POST` que recebe o payload do Supabase Database Webhook
2. Verificar `Authorization: Bearer {SUPABASE_WEBHOOK_SECRET}` no header (variável nova: `SUPABASE_WEBHOOK_SECRET`)
3. Parsear `record.kind === 'lost'` e `record.status === 'active'` — ignorar outros eventos
4. Verificar rate limit por `owner_id`: máximo 3 pets perdidos em 24h (buscar `notification_logs` com `status != 'rate_limited'`)
5. Se dentro do limite: fazer `fetch` para `N8N_PET_LOST_WEBHOOK_URL` (nova env var) com payload `{ pet_id, name, species, city, neighborhood, photo_url, owner_id }`
6. Inserir em `notification_logs` com `status = 'sent'` ou `status = 'rate_limited'`
7. Retornar `{ success: true }` em qualquer caso (webhook n8n não pode bloquear resposta)

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Request sem `Authorization` correto retorna 401
- [ ] Evento com `kind = 'found'` é ignorado silenciosamente
- [ ] 4º pet perdido do mesmo usuário em 24h gera log `rate_limited` e não dispara n8n
- [ ] Falha no fetch para n8n não quebra resposta (try/catch, log do erro)
- [ ] Variável `SUPABASE_WEBHOOK_SECRET` adicionada a `CLAUDE.md` e `.env.local.example`

---

## T4 — Configurar Database Webhook no Supabase

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** Documentação em `supabase/webhooks/README.md` (novo)

### O que fazer
1. Documentar passo a passo para configurar Database Webhook no Supabase Dashboard:
   - Tabela: `pets`
   - Evento: `INSERT`
   - URL: `{NEXT_PUBLIC_SITE_URL}/api/webhooks/pet-lost`
   - Headers: `Authorization: Bearer {SUPABASE_WEBHOOK_SECRET}`
2. Documentar variáveis de ambiente necessárias: `SUPABASE_WEBHOOK_SECRET`, `N8N_PET_LOST_WEBHOOK_URL`
3. Adicionar ambas as variáveis em `CLAUDE.md` → seção VARIÁVEIS DE AMBIENTE

### Harness Commands
```bash
# Verificar que variáveis estão listadas em CLAUDE.md
npm run typecheck
```

### Critério de Aceite
- [ ] README documenta o processo claramente
- [ ] Ambas as variáveis novas documentadas em CLAUDE.md
- [ ] `.env.local.example` atualizado com as novas vars (valores dummy)

---

## T5 — Workflow n8n: Agente de Notificação de Pet Perdido

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `n8n/workflows/pet-lost-notification.json` (novo — export do workflow)

### Especificação EARS
WHEN n8n recebe webhook de pet perdido
THE SYSTEM SHALL buscar voluntários da cidade e enviar notificações.

### O que fazer
Projetar o workflow n8n (documentar nodes e lógica):
1. **Webhook node**: recebe `{ pet_id, name, species, city, neighborhood, photo_url, owner_id }`
2. **HTTP Request** (Supabase REST): buscar `notification_subscriptions` onde `city = {{$json.city}}` AND `active = true`; select: `user_id, channel, profiles.telefone, profiles.email`
3. **IF node**: separar em `whatsapp` e `email`
4. **Loop Over Items** (WhatsApp): enviar mensagem formatada — sem Markdown, texto plano
5. **Loop Over Items** (Email): chamar `POST /api/notifications/send-email` interno
6. **HTTP Request** (log): `POST {SITE_URL}/api/notifications/log` com resultado
7. Modelo: `claude-sonnet-4-20250514` para gerar mensagem personalizada (temperatura 0.2)
8. Documentar em JSON exportável e salvar como `n8n/workflows/pet-lost-notification.json`

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] Workflow JSON exportado e salvo
- [ ] Documentação dos nodes no arquivo JSON (comentários/notas n8n)
- [ ] Mensagem WhatsApp em texto plano (sem *, #, ou Markdown)
- [ ] Temperatura do modelo <= 0.3 conforme CLAUDE.md

---

## T6 — UI: Toggle de assinaturas em `/perfil/configuracoes`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/perfil/configuracoes/page.tsx` (criar se não existir)

### O que fazer
1. Seção "Alertas de pets perdidos" com toggles por cidade e canal
2. Listar cidades disponíveis (enum fixo: cidades da Baixada Santista do CLAUDE.md)
3. Toggle WhatsApp: desabilitado se usuário sem telefone; tooltip explicativo
4. Chamar `POST /api/notifications/subscriptions` ao ativar e `DELETE` ao desativar
5. Feedback visual: spinner durante save, toast de confirmação

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Toggle WhatsApp desabilitado sem telefone no perfil
- [ ] Ativar alerta salva via API e reflete na UI sem reload
- [ ] `npm run typecheck` sem erros

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T5 → T6

**Dependências:**
- T2 depende de T1 (tabela notification_subscriptions)
- T3 depende de T1 (tabela notification_logs para rate limit)
- T4 é documentação, pode ser feito em paralelo com T3
- T5 depende de T1, T3 (usa tabela de subscriptions via REST e logs)
- T6 depende de T2 (API de assinaturas)

## Harness Global

```bash
npm run typecheck
npm run build
```

