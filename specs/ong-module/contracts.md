# Contracts — Módulo ONG
# SDD Fase 2: PLANEJAR — Contratos de API e payloads
# Segue padrão global: { success: true, data: {} } / { success: false, error: "" }
# ─────────────────────────────────────────────────────────────────────────

## Server Actions

### upsertShelter(formData: FormData) → ShelterActionResult

**Arquivo:** `app/ong/actions.ts`

Input (campos do formulário):
```typescript
{
  name: string           // required, min 2 chars
  type: 'ong' | 'protetor'
  cnpj?: string          // opcional, formato XX.XXX.XXX/XXXX-XX se presente
  phone: string          // required
  email?: string         // formato email se presente
  city: string           // required
  neighborhood?: string
  description?: string
  logo_url?: string
}
```

Output — Sucesso:
```typescript
{ ok: true, shelterId: string }
// → redirect para /ong/dashboard
```

Output — Erro:
```typescript
{ ok: false, errors: { campo: "mensagem" } }  // erro de validação
{ ok: false, message: "Erro interno" }         // erro de banco
```

### createAdoption(formData: FormData) → AdoptionActionResult

**Arquivo:** `app/ong/adocoes/actions.ts`

Input:
```typescript
{
  pet_id: string          // UUID
  adopter_name: string    // required
  adopter_contact: string // required — WhatsApp ou e-mail
  adoption_date: string   // ISO date
  notes?: string
}
```

Output — Sucesso:
```typescript
{ ok: true, adoptionId: string }
// Side effect: dispara webhook n8n (DEC-ONG-05)
```

---

## Webhook — n8n Follow-up (POST)

**Gatilho:** `createAdoption` Server Action
**Destino:** `process.env.N8N_ONG_ADOPTION_WEBHOOK_URL`
**Falha:** silenciosa — loga em webhook_logs, não bloqueia o fluxo

### Payload de saída (SOS Pet → n8n):
```json
{
  "event": "adoption.created",
  "adoption_id": "uuid",
  "adoption_date": "2026-06-08",
  "pet": {
    "id": "uuid",
    "name": "Rex",
    "species": "dog"
  },
  "shelter": {
    "id": "uuid",
    "name": "Proteção Animal Santos",
    "phone": "13999999999"
  },
  "adopter": {
    "name": "João Silva",
    "contact": "13988888888"
  }
}
```

### Resposta esperada do n8n:
```json
{ "success": true, "scheduled": ["30d", "90d"] }
```

### Comportamento indesejado:
SE o n8n retornar status ≠ 200 ou timeout (5s)
ENTÃO o sistema deve inserir em webhook_logs:
```json
{
  "event": "adoption.created",
  "adoption_id": "uuid",
  "error": "timeout | http_error",
  "created_at": "timestamp"
}
```

---

## Queries Supabase críticas (referência para agentes)

### Dashboard metrics (parallel)
```typescript
// Todas rodadas em Promise.all — nunca em sequência
supabase.from('shelter_pets').select('id', { count: 'exact', head: true })
  .eq('shelter_id', shelterId)
  .in('status', ['available', 'fostered'])

supabase.from('shelter_pets').select('id', { count: 'exact', head: true })
  .eq('shelter_id', shelterId)
  .eq('health_status', 'critical')

supabase.from('vaccinations').select('id, next_dose_date')
  .eq('shelter_id', shelterId) // via JOIN ou view
  .lte('next_dose_date', thirtyDaysFromNow)
  .gte('next_dose_date', today)
```

### Validação RLS (função helper)
```sql
-- Função SECURITY DEFINER (DEC-ONG-03)
CREATE OR REPLACE FUNCTION is_pet_owner(p_pet_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM shelter_pets sp
    JOIN shelters s ON sp.shelter_id = s.id
    WHERE sp.id = p_pet_id AND s.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;
```
