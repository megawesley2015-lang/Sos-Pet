# Sentry — setup off-by-default

> Configs prontos. Sentry só roda em produção quando `SENTRY_DSN` estiver definido. Sem DSN, o pacote degrada para no-op — zero overhead.

## Por que adotar
- **Server Actions silenciam erros**: `console.error` vai para a Vercel mas é ruim de filtrar/alertar. Sentry agrupa, dedupa e notifica.
- **Stack traces nas Server Actions** ficam pretty-printed com source maps.
- **Breadcrumbs** dão contexto (auth state, request URL, último input).

## Passo 1 — Criar projeto na Sentry

1. https://sentry.io/signup/ (free tier — 5k errors/mês).
2. Criar projeto **Next.js**, plataforma JavaScript.
3. Copiar o DSN (`https://xxxx@oXXXXXX.ingest.sentry.io/XXXX`).

## Passo 2 — Instalar o SDK

```bash
cd C:\Users\wesley\Documents\Claude\Projects\sos-pet
npm install @sentry/nextjs
```

## Passo 3 — Mover os arquivos `.example`

Os 4 arquivos abaixo já existem como `.example.ts` na raiz/instrumentation.
Renomeie removendo `.example`:

```
sentry.client.config.example.ts        → sentry.client.config.ts
sentry.server.config.example.ts        → sentry.server.config.ts
sentry.edge.config.example.ts          → sentry.edge.config.ts
instrumentation.example.ts             → instrumentation.ts
```

## Passo 4 — Variáveis de ambiente

Adicionar em `.env.local` (dev) e na Vercel (prod / preview):

```env
NEXT_PUBLIC_SENTRY_DSN=https://...@o000000.ingest.sentry.io/0000000
SENTRY_AUTH_TOKEN=sntrys_...     # opcional, só pra source maps no build
SENTRY_ORG=seu-org
SENTRY_PROJECT=sos-pet
```

`SENTRY_AUTH_TOKEN` é necessário só se quiser uploadar source maps (recomendado pra prod). Para dev, deixe em branco.

## Passo 5 — Validar

```bash
npm run build
```

Erros indicariam pacote/config faltando. Se passou, faça um `console.error("teste sentry")` proposital em alguma rota e cheque o dashboard Sentry → Issues.

## O que cada arquivo faz

- **sentry.client.config.ts** — captura erros do navegador (Client Components, hydration mismatches).
- **sentry.server.config.ts** — Server Components, Server Actions, Route Handlers (Node runtime).
- **sentry.edge.config.ts** — middleware.ts e Route Handlers em edge runtime.
- **instrumentation.ts** — o orquestrador Next.js: chama as configs server/edge na inicialização.

## Comportamento sem DSN

Cada config inicia com `if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;` — se não houver DSN, o init é pulado e o app roda sem overhead. **Não comite** os `.ts` finais sem `.example` enquanto o DSN não estiver configurado, ou o build da Vercel vai chamar `Sentry.init({ dsn: undefined })` (warning, não erro).

## Custo de runtime

Free tier cobre 5k errors e 10k transactions/mês — suficiente para o MVP. Se passar, considera-se trade entre upgradar plan ou ajustar `tracesSampleRate` (hoje 0.1 = 10% de traces).
