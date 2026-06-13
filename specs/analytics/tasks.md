# Tasks — Analytics (GA4 + Sentry)
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md

---

## T1 — Instalar SDKs e configurar Sentry

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:**
- `package.json`
- `sentry.client.config.ts` (novo)
- `sentry.server.config.ts` (novo)
- `sentry.edge.config.ts` (novo)
- `next.config.ts` (editar — withSentryConfig)

### O que fazer
1. `npm install @sentry/nextjs`
2. Criar `sentry.client.config.ts`:
   ```ts
   import * as Sentry from '@sentry/nextjs'
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
     environment: process.env.NODE_ENV,
   })
   ```
3. Criar `sentry.server.config.ts` com mesma configuração (sem `tracesSampleRate` diferente)
4. Criar `sentry.edge.config.ts` mínimo
5. Envolver `next.config.ts` com `withSentryConfig`:
   ```ts
   import { withSentryConfig } from '@sentry/nextjs'
   export default withSentryConfig(nextConfig, { silent: true, hideSourceMaps: true })
   ```
6. Se `NEXT_PUBLIC_SENTRY_DSN` ausente: `Sentry.init` não chamado (verificar com `if (dsn)`)

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `@sentry/nextjs` no `package.json`
- [ ] `sentry.client.config.ts` com `tracesSampleRate: 0.1` em produção
- [ ] `npm run build` sem erros de Sentry
- [ ] Sem DSN configurado, app não quebra

---

## T2 — Hook `useAnalytics` e Context Provider

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `lib/analytics/index.ts` (novo)

### Especificação EARS
THE SYSTEM SHALL inicializar GA4 apenas com consentimento aceito.

### O que fazer
1. Criar funções tipadas:
   ```ts
   declare function trackEvent(name: string, params?: Record<string, string | number>): void
   declare function trackPageView(path: string, title: string): void
   declare function initGA4(): void
   ```
2. `initGA4()`: injetar script `gtag.js` dinamicamente se `NEXT_PUBLIC_GA_MEASUREMENT_ID` presente
   — usar `document.createElement('script')` + `window.gtag('config', measurementId)`
3. `trackEvent(name, params)`: chamar `window.gtag('event', name, params)` — com guard `if (typeof window !== 'undefined' && window.gtag)`
4. `trackPageView(path, title)`: chamar `gtag('event', 'page_view', { page_path: path, page_title: title })`
5. Exportar `analytics` object com todos os métodos

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] `trackEvent` não lança erro em SSR (sem `window`)
- [ ] `trackEvent` não lança erro sem `window.gtag` (guard)
- [ ] `initGA4` injeta script apenas uma vez (verificar `document.getElementById('ga-script')`)
- [ ] `npm run typecheck` sem erros

---

## T3 — Banner de consentimento LGPD

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `components/ui/ConsentBanner.tsx` (novo)

### Especificação EARS
WHEN visitante acessa pela primeira vez
THE SYSTEM SHALL exibir banner de consentimento.

### O que fazer
1. Client Component que verifica `localStorage.getItem('analytics_consent')` no `useEffect`
2. Se valor ausente: mostrar banner fixo no bottom da tela
3. Banner: texto "Usamos cookies para melhorar sua experiência." + botões "Aceitar" / "Recusar"
4. Ao aceitar: `localStorage.setItem('analytics_consent', 'accepted')`; chamar `initGA4()`; fechar banner
5. Ao recusar: `localStorage.setItem('analytics_consent', 'rejected')`; fechar banner; NÃO chamar `initGA4()`
6. Estilo: posição `fixed bottom-0 left-0 right-0 z-50`; usar tokens do design system; botão principal `bg-primary`
7. Adicionar `<ConsentBanner />` em `app/layout.tsx`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Banner não aparece na segunda visita
- [ ] Aceitar → `initGA4()` é chamado
- [ ] Recusar → `initGA4()` NÃO é chamado
- [ ] Banner visível em mobile (posição fixed funciona)
- [ ] `npm run typecheck` sem erros

---

## T4 — Rastreamento de navegação SPA

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `components/analytics/PageTracker.tsx` (novo)

### Especificação EARS
WHEN usuário navega entre páginas
THE SYSTEM SHALL enviar `page_view` para GA4.

### O que fazer
1. Client Component usando `usePathname()` e `useSearchParams()` do `next/navigation`
2. `useEffect` com dependência em `pathname`: chamar `trackPageView(pathname, document.title)` quando pathname mudar
3. Verificar consentimento antes de rastrear: `localStorage.getItem('analytics_consent') === 'accepted'`
4. Adicionar `<PageTracker />` dentro de `<Suspense>` em `app/layout.tsx` (obrigatório para `useSearchParams`)

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Navegar entre páginas envia pageview no GA4 (visível no console.log em dev)
- [ ] Sem consentimento, pageview não é enviado
- [ ] `<Suspense>` envolve o `PageTracker` (necessário para `useSearchParams`)
- [ ] `npm run typecheck` sem erros

---

## T5 — Eventos de negócio nos pontos certos

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:** múltiplos (editar componentes/páginas existentes)

### O que fazer
1. **`pet_registered`**: em `app/(public)/achados-e-perdidos/novo/page.tsx` ou no Client Component de formulário, após resposta de sucesso da API: `trackEvent('pet_registered', { species, kind, city })`
2. **`contact_viewed`**: em `app/(public)/pets/[id]/page.tsx`, adicionar efeito client-side: `useEffect(() => trackEvent('contact_viewed', { pet_id: id, species, kind, city }), [])` — mas apenas se pet tem `contact_phone`
3. **`provider_contact`**: no `WhatsAppButton.tsx` (criado no módulo dashboard-prestador), antes de abrir link: `trackEvent('provider_contact', { provider_id, category, city })`
4. **`begin_checkout`**: em `/loja/checkout/page.tsx`, ao carregar: `trackEvent('begin_checkout', { value: total, currency: 'BRL' })`
5. **`purchase`**: em `/api/webhooks/mercadopago/route.ts`, após `status = 'paid'`: `trackEvent` não funciona no server — em vez disso, na página `/loja/sucesso`, ler `payment_id` e enviar evento client-side

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Cada evento usa `trackEvent` sem bloquear a UX
- [ ] `trackEvent` no server-side: não chamado (apenas client)
- [ ] Parâmetros de evento tipados corretamente
- [ ] `npm run typecheck` sem erros

---

## T6 — Captura de erros Sentry nas API Routes

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `lib/api-response.ts` (editar função `fail`)

### Especificação EARS
WHEN API Route retorna 5xx
THE SYSTEM SHALL capturar o erro no Sentry.

### O que fazer
1. Na função `fail(error: Error | string, status = 500)` em `lib/api-response.ts`:
   - Se `status >= 500`: capturar no Sentry com `Sentry.captureException(error)`
   - Importar Sentry de `@sentry/nextjs` com dynamic import para evitar bundle no client
2. Adicionar wrapper `withSentryErrorBoundary` nas páginas principais client-side
   (opcional — Sentry já captura automaticamente com a config de `sentry.client.config.ts`)
3. Testar que erros de runtime em API Routes aparecem no Sentry (verificar `sentry.server.config.ts` ativo)

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `fail(error, 500)` captura no Sentry
- [ ] `fail(error, 422)` NÃO captura no Sentry (erro de validação, não erro de servidor)
- [ ] Import de Sentry não quebra se DSN ausente
- [ ] `npm run typecheck` sem erros

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T5 → T6

**Dependências:**
- T2 pode ser feito em paralelo com T1
- T3 depende de T2 (`initGA4` do analytics lib)
- T4 depende de T2 (`trackPageView`)
- T5 depende de T2 (usa `trackEvent`)
- T6 depende de T1 (Sentry SDK instalado)

## Harness Global

```bash
npm run typecheck
npm run build
```

