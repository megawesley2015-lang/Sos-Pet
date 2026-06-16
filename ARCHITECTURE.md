# Architecture — SOS Pet Aumigo

Documento que descreve a arquitetura técnica, stack, convenções e padrões do projeto SOS Pet Aumigo.

---

## Stack Técnica

### Frontend & Runtime
- **Next.js 15** — App Router, Server Components por padrão
- **React 19** — Última versão, com melhorias de performance
- **TypeScript strict** — `compilerOptions.strict = true`, sem `any` implícito
- **Tailwind CSS 3** — Utility-first styling com configurações customizadas
- **CSS Modules** (quando necessário) — Para escopar estilos locais

### Backend & API
- **Next.js API Routes** (`app/api/`) — Edge-compatible
- **Supabase** — PostgreSQL + Auth + Storage + RLS (Row Level Security)
  - Auth: PKCE flow, session refresh automático
  - Database: Triggers PG para lógica complexa, RPCs (security definer)
  - Storage: Buckets com RLS por owner (`pets/`, `alert-cards/`, `prestadores/`)

### Testing & Quality
- **Vitest 2** — Test runner paralelo, HMR (Hot Module Reload)
- **Vitest UI** — Dashboard interativo de testes
- **ESLint 9** — Linting com config Next.js

### Observability
- **Sentry** — Error tracking e performance monitoring
  - Off-by-default: sem DSN configurado, não tem overhead
  - Configurado via `sentry.*.config.ts` (client, server, edge)
  - Ativado em produção via Environment Variables no Vercel

### External Services
- **Resend** — Email transacional (sign-up, password reset)
- **Cloudflare Turnstile** — Captcha anti-spam no cadastro anônimo
- **Mercado Pago** — Checkout de plaquinhas (clube SOS)
- **Printful** — Dropshipping de produtos (sync de catálogo, webhooks)
- **Google Analytics** — Telemetria (GA4)
- **Vercel** — Hosting, preview deployments, Analytics

---

## Estrutura de Diretórios

```
sos-pet/
├── app/                    # Next.js App Router — rotas por feature
│   ├── (auth)/            # Layout privado: auth pages
│   ├── (marketing)/       # Layout público: landing, dicas, termos
│   ├── admin/             # Rotas admin (protegidas)
│   ├── api/               # API routes
│   ├── auth/              # Sign-up, login, reset
│   ├── avistamentos/      # Listagem de pets encontrados
│   ├── cadastro/          # Cadastro anônimo de pet perdido
│   ├── dashboard-prestador/ # Dashboard de métricas
│   ├── loja/              # E-commerce (plaquinhas, produtos)
│   ├── mapa/              # Mapa interativo com leaflet
│   ├── meus-pets/         # Dashboard do owner
│   ├── ong/               # Perfis de ONGs
│   ├── perfil/            # Perfil do usuário
│   ├── pets/              # Detalhe de pet
│   ├── plaquinha/         # Geração de plaquinha SOS
│   ├── prestadores/       # Listagem e filtros
│   ├── resgate/           # Central de Resgate (SOS Button)
│   └── sentinela/         # Monitoramento de alertas
│
├── components/            # Componentes React reutilizáveis
│   ├── analytics/         # Componentes de telemetria
│   ├── auth/              # Componentes de autenticação
│   ├── layout/            # Layout wrappers (header, footer, sidebar)
│   ├── map/               # Componentes de mapa (Leaflet)
│   ├── maps/              # (possível duplicata com /map — revisar)
│   ├── marketing/         # Landing, hero, CTAs
│   ├── pets/              # Cards, filtros de pets
│   ├── providers/         # Context providers (Auth, Supabase, Theme)
│   ├── pwa/               # PWA features (install prompt)
│   ├── rescue/            # SOS Button, alert cards
│   ├── store/             # Carrinho, checkout
│   └── ui/                # Primitivos (Button, Input, Modal, etc)
│
├── lib/                   # Lógica reutilizável (não-React)
│   ├── alerts/            # Geração e histórico de alertas
│   ├── auth/              # Auth helpers (logout, session refresh)
│   ├── services/          # Chamadas a APIs externas
│   ├── supabase/          # Cliente Supabase, tipos, helpers
│   ├── types/             # TypeScript types/interfaces
│   ├── utils/             # Funções utilitárias (formatação, etc)
│   └── validation/        # Schemas Zod
│
├── __tests__/             # Testes (estrutura a revisar)
│
├── public/                # Assets estáticos
│
├── docs/                  # Documentação (README, guias, etc)
│
├── supabase/              # Migrações, seeders, tipos auto-gerados
│
├── scripts/               # Scripts de build/deploy
│   └── pre-deploy.mjs     # Validações antes de deploy
│
└── .github/workflows/     # GitHub Actions CI/CD
```

---

## Convenções & Padrões

### Naming
- **Arquivos**: `kebab-case` (ex: `pet-card.tsx`, `get-pets.ts`)
- **Componentes**: `PascalCase` (ex: `PetCard`, `AuthLayout`)
- **Variáveis**: `camelCase` (ex: `petId`, `isLoading`)
- **Constants**: `SCREAMING_SNAKE_CASE` (ex: `MAX_FILE_SIZE`)

### Organização de Componentes
```tsx
// 1. Imports
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

// 2. Types (inline se pequeno, ou em types.ts)
interface Props {
  petId: string
}

// 3. Component
export function PetCard({ petId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  return <div>...</div>
}
```

### Server Components vs Client Components
- **Default: Server Components** — melhor performance, sem hydration
- **`'use client'`** — apenas quando necessário (state, effects, browser APIs)
- **Exemplos**:
  - ✅ `page.tsx` — Server por padrão
  - ✅ `PetCard` — Server Component (recebe data como prop)
  - ❌ `PetCard` — Client se precisa de `useState`

### API Routes & RPCs
- **API Routes**: `app/api/[resource]/route.ts`
  - Validação Zod de input
  - RLS automático via `req.headers.get('Authorization')`
  - Tratamento de erros uniforme
- **RPCs**: `supabase/migrations/XXX_rpc_name.sql`
  - Security definer `security definer` para bypass RLS
  - Usadas em casos complexos (denormalização, agregação)

### Error Handling
- **Frontend**: `try/catch`, fallback UI, toast notifications
- **Backend**: Status HTTP correto (400, 401, 403, 500)
- **Auth**: `handleAuthError()` detecta token corrompido → cleanup + redirect

### TypeScript
```typescript
// ✅ Types explícitos
const fetchPets = async (city: string): Promise<Pet[]> => {}

// ✅ Interfaces para objetos
interface Pet {
  id: string
  name: string
}

// ✅ Unions para estados
type FetchState = 'idle' | 'loading' | 'success' | 'error'
```

### Testing
- **Unit tests**: `lib/` utilities
- **Integration tests**: API routes, RPCs
- **E2E tests**: (não configurado ainda)
- **Padrão**: `__tests__/` ou `.test.ts` colocalize ao código

---

## Deployment & Environment

### Local Development
```bash
npm run dev              # Next.js dev server
npm run typecheck       # Type checking
npm run test:watch      # Vitest em watch mode
npm run lint            # ESLint
```

### Environment Variables
- **`.env.local`** — Dev local, NUNCA commitado
- **`.env.example`** — Template com comentários (commitado)
- **Vercel**: Settings → Environment Variables para prod
- **Variáveis obrigatórias**: Supabase, Resend, Turnstile

### Pre-deploy Checks
- `npm run pre-deploy` — Script de validação em `scripts/pre-deploy.mjs`
  - Type checking, linting, build test, SEO validation

### Sentry
- **Off by default** — sem overhead se DSN não configurado
- **Enable**: Definir `NEXT_PUBLIC_SENTRY_DSN` em Vercel
- **Source maps**: Ativado via `SENTRY_AUTH_TOKEN`

---

## Security Highlights

### Authentication & Authorization
- PKCE flow (RFC 7636) — protege implicit flow attacks
- Session refresh automático nos cookies
- Middleware SSR protege rotas privadas
- RLS em todas as tabelas (Supabase)

### API Security
- Input validation com Zod
- CORS configurado (Vercel default)
- Rate limiting (Vercel via Middleware)
- CSRF tokens em forms (Next.js automático)

### Data Protection
- Supabase Storage: RLS por owner, uploads validados
- Credenciais: `.env.local` no `.gitignore`
- Service Role Key: Nunca vai pro browser (server-only)

---

## Troubleshooting & Common Issues

### "Token inválido" errors
- **Causa**: Supabase token corrompido ou expirado
- **Fix**: `handleAuthError()` no middleware faz cleanup

### Build fails com TypeScript
- **Causa**: `strict: true` captura erros invisíveis
- **Fix**: `npm run typecheck` localmente antes de push

### Slow builds
- **Revisar**: Tamanho de bundles (Next.js Analyzer)
- **Revisar**: Imports desnecessários, lazy-load quando possível

---

## Próximos Passos & Melhorias Planejadas

- [ ] Testes E2E (Playwright)
- [ ] Refatorar `components/` com hierarquia melhor
- [ ] Documentar RPCs complexas
- [ ] Caching strategy (Next.js Cache API)
- [ ] Performance: Image optimization, code splitting

