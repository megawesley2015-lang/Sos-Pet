---
name: pwa-push
status: pending
priority: 2
depends_on: []
---

# PWA + Notificações Push

## O que implementar

### 1. Manifest PWA
- Criar `public/manifest.json` com name, icons, theme_color (#FF851B), display: standalone
- Adicionar `<link rel="manifest">` em `app/layout.tsx`
- Ícones: 192x192 e 512x512 em `/public/icons/`

### 2. Service Worker
- Criar `public/sw.js` com cache strategy (cache-first para assets estáticos)
- Registrar SW em `components/providers/ServiceWorkerProvider.tsx`

### 3. Push Notifications via Web Push
- Instalar `web-push` (server-only)
- Criar tabela Supabase `push_subscriptions(id, user_id, endpoint, keys jsonb, created_at)`
- `POST /api/push/subscribe` — salva subscription do browser
- `POST /api/push/send` — envia notificação (server-only, via n8n webhook)

### 4. Opt-in na UI
- Botão "Ativar alertas" em `/meus-pets` e `/achados-e-perdidos`
- Só aparece se browser suportar Notification API

### 5. Gatilho de envio
- Webhook n8n existente (`N8N_ADOPTION_WEBHOOK_URL`) aciona o endpoint `/api/push/send`
- Payload: `{ title, body, url, user_ids[] }`

## Harness gate
```bash
npm run typecheck && npm run build
```

## Critério de aceite
- `public/manifest.json` válido (Lighthouse PWA check verde)
- Botão opt-in funciona e salva subscription no Supabase
- `POST /api/push/send` retorna 200 e entrega notificação no browser
