# SOS Pet — Achados & Perdidos

Plataforma colaborativa de registro de pets perdidos e encontrados, com Central de Resgate (cartaz SOS gerado automaticamente), rede de prestadores e avaliações.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind 3 · Supabase (Auth + Postgres + Storage + RLS) · Vercel.

---

## Features (MVP)

### Pets — Achados & Perdidos
- Cadastro público (sem login) ou logado, perdido ou encontrado
- Upload de foto pro Supabase Storage
- Listagem pública com filtros por tipo, espécie, cidade
- Detalhe com contato (WhatsApp + telefone)
- Edição/exclusão owner-only via RLS

### Auth
- Sign up + email confirmation (PKCE)
- Login, esqueci/redefinir senha
- Trigger PG cria profile automaticamente no signup
- Middleware SSR protege rotas (`/meus-pets`, `/perfil`, `/resgate`, `/dashboard-prestador`, etc.)
- Session refresh automático nos cookies
- `handleAuthError` detecta token corrompido e faz cleanup

### Central de Resgate (SOS)
- SOSButton com long-press 2s (vibração + glow + radar)
- Geração de card PNG 600×900 via `html-to-image`
- Web Share API com fallback de download
- Histórico de alertas por pet
- Bucket `alert-cards` com RLS por owner

### Prestadores
- CRUD completo com slug único auto-gerado
- 6 categorias (vet, petshop, adestrador, hospedagem, banho_tosa, outro)
- Logo + capa em Storage com RLS por owner
- Filtros: busca, cidade, categoria, 24h, delivery
- Avaliações 1-5 estrelas com upsert (1 review/user/prestador)
- Trigger PG mantém média denormalizada
- RPCs `incrementar_visualizacao_prestador` / `incrementar_clique_whatsapp` (security definer)
- Dashboard `/dashboard-prestador` com métricas reais por estabelecimento

### Marketing & SEO
- Landing pública em `/` com hero híbrido (dark→warm), stats reais, CTAs
- Tema light/warm via `data-theme="light"` em wrapper (sem duplicação de código)
- Páginas estáticas: dicas, parcerias, termos, privacidade
- Banner ticker no topo com avisos rotativos
- Form de parcerias com validação Zod, insert público
- `sitemap.xml` dinâmico (rotas + pets + prestadores)
- `robots.txt` que bloqueia rotas privadas

### Perfil
- Edição de nome, telefone, avatar
- Avatar exibido na TopBar e nas avaliações

---

## Estrutura de pastas

```
sos-pet/
├── app/
│   ├── (marketing)/           # Light/warm — landing + estáticas
│   │   ├── layout.tsx         # Inclui AvisosTicker + Header + Footer
│   │   ├── page.tsx           # Landing
│   │   ├── dicas/             # /dicas
│   │   ├── parcerias/         # /parcerias (form)
│   │   ├── termos/            # /termos
│   │   └── privacidade/       # /privacidade
│   ├── (auth)/                # Auth flow
│   │   ├── login/, registro/
│   │   ├── esqueci-senha/, redefinir-senha/
│   ├── auth/callback/         # PKCE exchange
│   ├── pets/                  # Listagem + CRUD
│   ├── prestadores/           # Listagem + CRUD + detalhe + edit
│   ├── meus-pets/             # Painel do tutor
│   ├── resgate/               # Central SOS
│   ├── dashboard-prestador/   # Painel do prestador
│   ├── perfil/                # Edição perfil
│   ├── sitemap.ts             # SEO dinâmico
│   ├── robots.ts              # SEO
│   ├── layout.tsx             # Root (dark default)
│   └── globals.css            # Tokens CSS + utilities
│
├── components/
│   ├── auth/                  # AuthCard, FormField, FormAlert, SubmitButton
│   ├── layout/                # TopBar, MarketingHeader, MarketingFooter, UserMenu
│   ├── marketing/             # PageHeader, AvisosTicker
│   ├── pets/                  # PetCard, PetForm, PetGrid, PetFilters, PhotoUpload
│   ├── providers/             # PrestadorCard, PrestadorForm, AvaliacaoForm,
│   │                          # AvaliacoesList, StarRating, WhatsappButton, etc.
│   ├── rescue/                # SOSButton, SOSAlertCard, RescueLauncher
│   └── ui/                    # CTAButton, FilterChip, SOSBadge
│
├── lib/
│   ├── alerts/                # generateImage (html-to-image), share (Web Share API)
│   ├── auth/                  # errors (handleAuthError), safe (getUserSafe)
│   ├── services/              # pets, providers, reviews, alerts, profiles, avisos
│   ├── supabase/              # server, client, middleware
│   ├── types/database.ts      # Tipos manuais espelhando o schema
│   ├── utils/                 # cn, env, format, url
│   └── validation/            # Zod schemas (auth, pet, alert, provider, review,
│                              # parceiro, profile)
│
├── scripts/pre-deploy.mjs     # typecheck + build + audit secrets
├── supabase/schema.sql        # Schema completo (idempotente)
├── middleware.ts              # Refresh cookies + proteção de rotas
├── tailwind.config.ts         # Design tokens
└── package.json
```

---

## Setup local

```bash
# 1. Clone + instala
git clone <seu-repo> sos-pet && cd sos-pet
npm install

# 2. Copia o template de env
cp .env.example .env.local
# Preencha com as credenciais do seu projeto Supabase

# 3. Aplica o schema no Supabase
# Cola o conteúdo de supabase/schema.sql no SQL Editor → Run
# (idempotente, pode rodar de novo sem medo)

# 4. Sobe o dev server
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Deploy na Vercel

### 1. Repositório no GitHub

```bash
git init
git add .
git commit -m "feat: MVP SOS Pet"
git branch -M main
git remote add origin git@github.com:<seu-usuario>/sos-pet.git
git push -u origin main
```

### 2. Criar projeto na Vercel

1. [vercel.com/new](https://vercel.com/new) → importa o repo
2. Framework: **Next.js** (auto-detectado)
3. **Environment Variables** — adiciona as 3 do `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (marca **Secret**, desmarca "Available in browser")
   - `NEXT_PUBLIC_SITE_URL` (preencher com a URL final, ex: `https://sospet.app`)
   - `NEXT_PUBLIC_APP_URL` (igual ao acima)
4. Clica **Deploy**

### 3. Configurar Supabase Auth

No Supabase Dashboard:
- **Authentication → URL Configuration**
  - **Site URL**: a URL final (`https://sospet.app` ou `https://seu-projeto.vercel.app`)
  - **Redirect URLs**: adicione tanto a prod URL quanto a Vercel preview URL (`https://*.vercel.app/auth/callback`)
- **Authentication → Email Templates** (opcional)
  - Personalizar copy dos e-mails de confirmação/recovery

### 4. Antes do primeiro git push

Roda o pre-deploy local pra evitar build quebrar na Vercel:

```bash
npm run pre-deploy
```

Faz: typecheck + build + audit do `.gitignore` + scan de secrets hardcoded.

---

## Decisões técnicas

**Server Components como default.** Listagem, detalhe, dashboard tudo é SSR — sem fetch waterfall, sem JS extra. Só formulários e botões interativos usam `"use client"`.

**Server Actions ao invés de API routes.** Login, signup, CRUD de pet/prestador, avaliação, SOS — tudo via Server Action + `useActionState` (React 19). Menos boilerplate que `/api/...`, validação Zod no servidor, FormData transparente pra upload.

**RLS desde o primeiro dia.** Toda tabela nasce com RLS. Anon pode ler ativos e cadastrar pet (regra de negócio), tudo o resto é gated por `auth.uid()`. Defesa em profundidade: o service layer também checa ownership antes do UPDATE/DELETE.

**Stats escrevem só via RPC `SECURITY DEFINER`.** RLS bloqueia INSERT/UPDATE direto em `prestador_stats`. Cliente só pode chamar `incrementar_*` que faz `+1`. Impede inflar/zerar contadores.

**Slug único auto-gerado.** No INSERT, `slugify(nome)` + checagem de colisão (sufixo `-2`, `-3`, ...). Slug não regenera no UPDATE pra não quebrar links externos.

**Trigger `atualizar_media_prestador`.** Roda em INSERT/UPDATE/DELETE de avaliação. Recalcula `total_avaliacoes` e `media_avaliacoes` direto na tabela de prestadores. Listagem ordena por média sem JOIN.

**Tema híbrido por wrapper.** Root layout aplica `data-theme="dark"` no `<html>`. `(marketing)/layout` aplica `data-theme="light"` num `<div>` interno. Mesmo CSS variables, paletas diferentes por subtree. Zero duplicação.

**Tipos manuais (`lib/types/database.ts`).** Pra MVP, evita dependência do Supabase CLI. Quando o schema crescer, troca por geração automática:
```bash
npx supabase gen types typescript --project-id <ID> > lib/types/database.ts
```

---

## Riscos e dívidas conhecidas (intencionais no MVP)

1. **Cadastro de pet anônimo é vetor de spam.** Mitigar com Cloudflare Turnstile ou captcha do Supabase antes do launch público.
2. **Upload público no bucket `pet-photos`.** Aceita qualquer imagem JPG/PNG/WebP até 5 MB (validado no Server Action). Pra produção: Edge Function que checa MIME real e dimensões.
3. **Sem rate-limit no SOS.** Pode disparar N alertas pro mesmo pet. Adicionar trigger PG `before insert` validando "máx 5/hora/pet".
4. **Sem moderação automática.** Prestador entra com `status='ativo'` direto. Admin (F7) pode aprovar/rejeitar manualmente. Schema já suporta `pendente_aprovacao`.
5. **Tracking de cliques sem dedupe.** Bot pode inflar `visualizacoes`. Pra produção: dedupe por IP/user-id em Edge Function.
6. **Termos e Privacidade são placeholders.** Substituir por texto revisado por advogado LGPD antes de campanha pública.
7. **Sem testes automatizados.** TypeScript strict + Zod cobre boa parte. E2E (Playwright) entra pós-MVP.
8. **Email transacional vai pelo Supabase default.** Com volume, migrar pra Resend/Postmark pra delivery confiável.

---

## Scripts npm

| Script | O que faz |
|---|---|
| `npm run dev` | Dev server (porta 3000) |
| `npm run build` | Build de produção |
| `npm start` | Inicia o server de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run pre-deploy` | typecheck + build + audit (rode antes de push) |

---

## Roadmap pós-MVP

- **F7 Admin** — `/admin` pra moderar prestadores pendentes, aprovar parceiros, gerir avisos
- **PWA** — manifest + service worker pra instalar no celular
- **Notificações** — push nativo + WhatsApp via Twilio/Z-API quando alguém ver o pet no raio
- **Geolocalização** — `sightings` com PostGIS + mapa de calor
- **Matching automático** — vetor de similaridade descrição/foto entre lost↔found
- **Tags QR físicas** — gera QR com link curto pra cada pet
- **Marketplace** — produtos de pet shops parceiros (Stripe + dropshipping)

---

Construído por wes com ajuda do Claude (Anthropic) — 2026.
