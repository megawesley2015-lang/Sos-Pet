# Database Webhook — pets INSERT

## Como configurar no Supabase Dashboard

1. Acesse **Database → Webhooks → Create a new hook**
2. Configure:
   - **Name**: `on_pet_lost_insert`
   - **Table**: `pets`
   - **Events**: `INSERT`
   - **Type**: HTTP Request
   - **URL**: `{NEXT_PUBLIC_SITE_URL}/api/webhooks/pet-lost`
   - **HTTP Method**: POST
   - **Headers**:
     - `Authorization: Bearer {SUPABASE_WEBHOOK_SECRET}`
     - `Content-Type: application/json`

## Variáveis de ambiente necessárias

```env
SUPABASE_WEBHOOK_SECRET=     # segredo aleatório, gerado com: openssl rand -hex 32
N8N_PET_LOST_WEBHOOK_URL=    # URL do webhook node no n8n
```

## Fluxo completo

```
INSERT em pets (kind=lost)
  → Supabase Database Webhook
    → POST /api/webhooks/pet-lost
      → verifica rate limit (max 3 pets/24h por usuário)
        → fetch para N8N_PET_LOST_WEBHOOK_URL
          → n8n busca assinantes da cidade
            → envia WhatsApp / Email
```

## Variáveis a adicionar no `.env.local`

```env
SUPABASE_WEBHOOK_SECRET=seu-segredo-aqui
N8N_PET_LOST_WEBHOOK_URL=https://seu-n8n.com/webhook/pet-lost
```
