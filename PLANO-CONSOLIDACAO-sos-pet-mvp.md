# Plano de Consolidação — SOS Pet MVP

**Destino:** `C:\Users\wesley\sos-pet-mvp` (pasta nova, limpa)
**Stack-alvo:** Next.js 15.1 App Router · TypeScript strict · Tailwind CSS 3.4 · Supabase (SSR + RLS + Storage) · Vercel
**Autor:** Claude · **Data:** 2026-04-24
**Status:** Aguardando aprovação do wes antes de executar

---

## 1. Por que consolidar

Hoje há 4 pastas ativas do SOS Pet, cada uma com pedaços diferentes e dívidas diferentes. A consolidação resolve três problemas que o wes levantou:

1. **Perdi features focando em paleta.** O projeto é muito maior que Achados e Perdidos — tem auth, prestadores, dashboard, admin, landing. Precisamos trazer tudo junto.
2. **Stack divergente.** `sos-pet-v2` mistura JS e TS, usa Tailwind 4 canary, tem backend Express separado com segredos hardcoded. `Meu Saas` já é TS puro, Supabase SSR correto, Tailwind 3 estável, design aprovado.
3. **Backend Express é um risco.** `sos-pet-backend` tem Google API key e senha do Postgres em plaintext, sem JWT, sem autenticação nos endpoints. Substituir por Supabase direto com RLS elimina essa superfície.

Consolidar em pasta nova (ao invés de mexer no v2) preserva o v2 como backup e nos dá um ponto de partida limpo.

---

## 2. Stack alvo — por que essas versões

| Camada | Escolha | Razão |
|---|---|---|
| Next.js | **15.1** (não 16) | 15.1 é estável, 16 ainda é beta. Menos risco de breaking change durante o build do MVP. |
| React | 19.0 stable | Requerido pelo Next 15.1. |
| TypeScript | 5.x strict | Acabar com a mistura JS/TS do v2. Strict pega erros cedo. |
| Tailwind | **3.4** (não 4) | Tokens do Meu Saas já funcionam em v3.4. v4 ainda tem arestas em prod. Migramos depois se valer. |
| Supabase | `@supabase/ssr` + `supabase-js@2.45+` | Cookies via SSR (server + browser + middleware), padrão atual. v2 usa só browser client — menos seguro. |
| Validação | **Zod** | Ausente no v2 e no backend. Bloqueia bugs silenciosos em forms e em Server Actions. |
| Mapas | **Leaflet 1.9** (manter do v2) | Já funciona, sem motivo pra trocar no MVP. |
| Auth | Supabase Auth (PKCE) | Já usado no v2, bem configurado. Adicionamos **middleware de rota no servidor** (falta no v2). |

**Fora do MVP:** React Query (adicionar quando a lista de pets crescer), PWA (v2 já tem, portamos em F6), Leaflet clustering (otimização futura).

---

## 3. O que vai entrar — mapa de origem por feature

### Do `Meu Saas` (fonte visual e estrutural)

- `tailwind.config.ts` — paleta brand/cyan/ink/warm, glow shadows, animate-pulse-brand, bg-grid-subtle.
- `app/globals.css` — tokens CSS com `data-theme="dark"/"light"`, formato RGB.
- `lib/supabase/server.ts` + `lib/supabase/browser.ts` — padrão SSR correto.
- `lib/types/database.ts` — tipos base (PetRow, PetKind, etc).
- `components/ui/` — SOSBadge, CTAButton.
- `components/layout/TopBar.tsx`.
- `components/pets/PetCard`, `PetFilters`, `PetGrid`.
- `app/pets/page.tsx` + `app/pets/[id]/page.tsx` — listagem e detalhe com filtros por URL.
- `supabase/schema.sql` — base do schema consolidado (expandir).

### Do `sos-pet-v2` (fonte funcional, converter pra TS)

- `src/app/page.js` → `app/page.tsx` — landing hero + stats + depoimentos. Refatorar em componentes menores.
- `src/app/login`, `registro`, `esqueci-senha`, `redefinir-senha`, `auth/callback` → adaptar pra Server Actions + middleware SSR.
- `src/app/achados-e-perdidos/cadastrar`, `editar/[id]` → converter form pra Server Action + Zod.
- `src/app/meus-pets` → dashboard pessoal do tutor.
- `src/app/prestadores`, `prestadores/[slug]` → listagem + detalhe. Schema novo de prestadores.
- `src/components/Header.js` → `app/(marketing)/_components/Header.tsx` (versão marketing/light) + `TopBar` (versão app/dark).
- `src/services/auth.service.js` — lógica de error handling (portar como utility).
- `src/services/pets.service.js`, `prestadores.service.js` — padrões de query com filtros (reutilizar ideia, reescrever em TS).
- `src/components/Map/` — Leaflet wrapper (portar com `next/dynamic` sem SSR).

### Do `sos-pet-backend` (descartar 90%, reaproveitar só 1 coisa)

- **Descartar:** Express inteiro, auth (vira Supabase Auth), CRUD (vira Supabase client + RLS), segredos hardcoded.
- **Portar:** lógica de geocoding do Google → `app/api/geocode/route.ts` (Route Handler) com `GOOGLE_GEOCODING_API_KEY` em env server. Só chamado do servidor, nunca expõe a key.

### Descartar integralmente

- `sos-pet` (minimal, só 3 páginas).
- `meu-saas` (versão intermediária).
- Backup no Downloads.

---

## 4. Schema Supabase consolidado

Schema único versionado em `sos-pet-mvp/supabase/schema.sql`. Baseado no que já existe + o que o v2 precisa.

```
-- Tabelas principais (nomes em inglês, padrão Supabase)
auth.users                   -- gerenciada pelo Supabase Auth
public.profiles              -- 1-pra-1 com auth.users, campos extras (name, phone, role, avatar)
public.pets                  -- lost/found (campo kind), link com profiles via owner_id
public.providers             -- prestadores (veterinário, pet shop, adestrador, etc)
public.provider_services     -- serviços oferecidos por cada prestador (N-pra-N)
public.provider_categories   -- categorias (lookup)
public.reviews               -- avaliações (profile_id → provider_id)
public.sightings             -- avistamentos de pets (location_point via PostGIS)
public.admin_reports         -- denúncias/moderação (fora do MVP mas deixar tabela pronta)

-- Triggers
- profiles insert on auth.users create
- updated_at auto-update em pets/providers/reviews

-- Extensões
- postgis (pro point geográfico de sightings e providers)

-- RLS policies (resumo)
- profiles: SELECT próprio, UPDATE próprio; SELECT público de name/avatar/role
- pets: SELECT público onde status='active'; INSERT anônimo com owner_id null OK;
        UPDATE/DELETE só se auth.uid()=owner_id
- providers: SELECT público; UPDATE só se auth.uid()=owner_id; INSERT só user autenticado
- reviews: SELECT público; INSERT só user autenticado; UPDATE/DELETE só autor
- sightings: SELECT público; INSERT público (com rate limit via função)
- admin_reports: SELECT/UPDATE só role='admin'

-- Storage buckets
- pet-photos (public read, auth-only write)
- provider-logos (public read, owner-only write)
- avatars (public read, owner-only write)
```

Schema completo será escrito na F0. Inclui índices (created_at DESC em pets, gin em providers.categories, gist em location_point).

---

## 5. Estrutura de pastas alvo

```
sos-pet-mvp/
├── app/
│   ├── (marketing)/              # grupo sem layout dark — light-warm
│   │   ├── page.tsx              # landing
│   │   ├── dicas/
│   │   ├── parcerias/
│   │   ├── termos/
│   │   ├── privacidade/
│   │   └── _components/
│   ├── (auth)/                   # login, registro, esqueci-senha, redefinir
│   ├── (app)/                    # grupo dark — app autenticado
│   │   ├── achados/              # listagem + detalhe
│   │   ├── achados/cadastrar/
│   │   ├── achados/[id]/editar/
│   │   ├── prestadores/
│   │   ├── prestadores/[slug]/
│   │   ├── meus-pets/
│   │   ├── perfil/
│   │   ├── dashboard-prestador/
│   │   └── admin/
│   ├── api/
│   │   └── geocode/route.ts      # ex-express, agora Route Handler
│   ├── auth/callback/route.ts    # Supabase auth callback (PKCE)
│   ├── layout.tsx                # root (metadata, fonts, GA, PWA manifest)
│   └── globals.css               # tokens
├── components/
│   ├── layout/                   # Header, Footer, TopBar
│   ├── ui/                       # botões, badges, inputs — primitivos
│   ├── pets/                     # PetCard, PetFilters, PetForm
│   ├── providers/                # ProviderCard, ProviderFilters
│   ├── map/                      # Leaflet com dynamic import
│   └── auth/                     # AuthGuard, LoginForm, etc
├── lib/
│   ├── supabase/
│   │   ├── server.ts             # server component / action / route
│   │   ├── browser.ts            # client component
│   │   └── middleware.ts         # refresh de cookies em middleware.ts
│   ├── types/
│   │   ├── database.ts           # gerado + estendido
│   │   └── app.ts                # tipos de domínio
│   ├── validation/               # schemas Zod
│   ├── utils/                    # format, dates, phone, etc
│   └── services/                 # queries Supabase reutilizáveis (data layer)
├── supabase/
│   ├── schema.sql
│   ├── migrations/               # pra quando usar supabase CLI
│   └── seed.sql                  # dados de dev
├── middleware.ts                 # protege rotas (app), refresca cookies
├── tailwind.config.ts
├── tsconfig.json                 # strict, @/* alias
├── next.config.ts
├── package.json
├── .env.local                    # copiar do Meu Saas (já tem keys válidas)
└── README.md
```

---

## 6. Fases de execução — com critério de pronto

### F0 — Scaffold base (est. 45 min)
- `pnpm create next-app` com as flags certas, ou clonar estrutura do Meu Saas.
- Instalar deps: `@supabase/ssr`, `supabase-js`, `zod`, `clsx`, `tailwind-merge`, `lucide-react`.
- Portar `tailwind.config.ts`, `globals.css`, `lib/supabase/*`, `lib/types/database.ts`.
- Criar `middleware.ts` que refresca cookies + protege `(app)` com redirect pra `/login`.
- `.env.local` com as keys do Meu Saas.
- Schema SQL expandido aplicado no Supabase.
- **Pronto quando:** `pnpm dev` roda, `/` mostra placeholder, cookies Supabase se persistem entre reloads.

### F1 — Auth completo (est. 1h30)
- Páginas `(auth)/login`, `(auth)/registro`, `(auth)/esqueci-senha`, `(auth)/redefinir-senha`.
- `app/auth/callback/route.ts` (Code exchange PKCE).
- Server Actions de signIn/signUp/reset com validação Zod.
- Trigger no Supabase pra criar row em `profiles` quando `auth.users` ganha linha.
- Rate limit básico em reset-password (via Supabase Auth settings).
- **Pronto quando:** criar conta → receber email de confirmação → login → aparece avatar na TopBar. Middleware redireciona `/meus-pets` pra `/login` se deslogado.

### F2 — Achados e Perdidos (est. 2h)
- Portar e converter `app/(app)/achados/page.tsx` (listagem) — já temos em TS.
- `app/(app)/achados/[id]/page.tsx` (detalhe).
- `app/(app)/achados/cadastrar/page.tsx` — form com upload pra Storage + Zod + Server Action.
- `app/(app)/achados/[id]/editar/page.tsx` — owner-only via RLS.
- `app/(app)/meus-pets/page.tsx` — lista pets do user logado.
- **Pronto quando:** cadastrar pet anônimo funciona, cadastrar logado funciona, editar só do dono, filtros funcionam, upload de foto persiste.

### F3 — Landing + páginas estáticas (est. 1h30)
- `app/(marketing)/page.tsx` — hero híbrido (dark → warm) portado do v2, refatorado em 5-6 componentes.
- Header marketing (light) + Footer.
- `dicas`, `parcerias`, `termos`, `privacidade` — placeholders com conteúdo do v2.
- **Pronto quando:** `/` renderiza sem JS extra (tudo Server Component exceto CTAs), performa bom em Lighthouse.

### F4 — Prestadores (est. 2h)
- Schema `providers`, `provider_categories`, `provider_services`, `reviews`.
- `app/(app)/prestadores/page.tsx` — listagem com filtros (categoria, busca, 24h, delivery).
- `app/(app)/prestadores/[slug]/page.tsx` — detalhe com avaliações.
- RPC `increment_provider_view` e `increment_provider_whatsapp_click`.
- **Pronto quando:** listagem carrega, filtros funcionam, detalhe por slug abre, contagem de cliques incrementa.

### F5 — Dashboard prestador (est. 1h30)
- `app/(app)/dashboard-prestador/page.tsx` — métricas reais (views, cliques, reviews).
- Edit do perfil do prestador.
- Upload de logo.
- **Pronto quando:** prestador loga, vê suas métricas reais do DB, edita perfil, sobe logo.

### F6 — PWA + SEO + polish (est. 1h)
- Portar PWA manifest e service worker do v2.
- Metadata por rota (OG tags, Twitter cards).
- Google Analytics (opcional, mesmo padrão do v2).
- Loading/Error boundaries em todas rotas.
- **Pronto quando:** Lighthouse mobile ≥90 em perf/SEO/a11y, instala como PWA no Chrome.

### F7 — Admin (est. 1h, opcional no MVP)
- `app/(app)/admin/page.tsx` — guard por `profiles.role='admin'` (RLS).
- Listagem de reports, approve/reject de providers.
- **Pronto quando:** admin logado vê painel, flagged content aparece.

**Total estimado:** ~10h de execução em fases.

---

## 7. Riscos e dívidas que fico de olho

1. **Migração de dados existentes.** Se o wes já tem pets/users/providers no Supabase atual do v2, precisamos de um script de backfill. Pergunta aberta: quanto tem hoje em prod?
2. **Tailwind v3 vs v4.** Se preferir v4 (como v2), a migração dos tokens funciona mas precisa testar glow e bg-grid utilities — `@apply` mudou. Recomendo ficar em v3 até v4 estabilizar.
3. **Mapa com Leaflet SSR.** Precisa `dynamic import` com `ssr: false` sempre. Adiciona um flash inicial. Se virar problema, trocamos por Mapbox GL (melhor perf, pago).
4. **Geocoding.** Mover a API key pra env server resolve o vazamento, mas a cada cadastro de pet/prestador vamos consumir chamada. Considerar cache (tabela `geocode_cache` com TTL) se escalar.
5. **Rate limit.** Cadastro de pet anônimo é vetor de spam. MVP: confiamos em captcha do Supabase ou Cloudflare Turnstile na F2. Sem isso, alguém pode poluir a lista.
6. **Role do usuário.** `profiles.role` com valores `tutor` / `provider` / `admin`. Definir cedo — afeta middleware e menus. Hoje o v2 tem `user_type` com `common`/`provider`/`admin` — vamos renomear pra `tutor` pra ficar explícito.
7. **PostGIS.** A extensão precisa estar habilitada no Supabase antes do schema rodar. Dashboard Supabase → Extensions → habilitar `postgis`.
8. **Email de confirmação em dev.** Em dev, Supabase manda email real — pode cair em spam. Alternativa: desabilitar "Confirm email" em dev e ligar em prod.

---

## 8. Decisões que preciso do wes antes de escrever código

1. **Next 15.1 ou Next 16?** Recomendo 15.1 (estável). v2 tá no 16 canary.
2. **Tailwind v3 ou v4?** Recomendo v3.4 (tokens já funcionam). v2 tá no v4.
3. **`pnpm`, `npm` ou `yarn`?** v2 parece usar npm. Recomendo pnpm (mais rápido, lockfile determinístico).
4. **Migração de dados de produção?** Tem pets/providers já cadastrados no Supabase do v2 que não podem ser perdidos?
5. **Domínio e deploy.** Vamos deployar o `sos-pet-mvp` na Vercel em um projeto novo, e só quando estiver validado apontar o domínio? Ou substituir direto o projeto v2 na Vercel?
6. **Ordem das fases flexível?** Se alguma fase é mais urgente (ex: F4 prestadores antes de F3 landing), podemos reordenar.

---

## 9. O que eu NÃO vou fazer (confirmar com wes)

- Não vou mexer em `sos-pet-v2` — fica intacto como backup/referência.
- Não vou sobrescrever `Meu Saas` — mantido pros tokens e como sandbox visual.
- Não vou portar o backend Express. Geocoding vira Route Handler no Next.
- Não vou tocar em features fora da lista (tags QR, rastreamento GPS, marketplace, dropshipping, mapa de calor, etc) — fora do MVP.
- Não vou adicionar testes automatizados no MVP. Validação manual no browser + TypeScript + Zod são suficientes pra F0–F6. Testes E2E (Playwright) entram depois.

---

## 10. Próximo passo

Você revisa esse plano e me responde:
- Aprova como está? → começo F0 imediatamente.
- Quer mexer em algo? → me diz o quê e refaço as seções afetadas.
- Tem dúvida sobre alguma decisão técnica? → respondo antes de executar.

Nenhum arquivo em `sos-pet-mvp` vai ser criado antes desse OK.

---

# ADENDO — 2026-04-24 (pós-consolidação inicial e re-auditoria do v2)

> O plano acima foi escrito antes da consolidação física e antes de uma auditoria mais profunda do `sos-pet-v2`. Esta seção registra **o que mudou** e **o que faltava** — o plano original fica como histórico, este adendo é a fonte da verdade dali pra frente.

## A0. Mudanças no destino e estado atual

- **Pasta destino mudou.** Não é mais `C:\Users\wesley\sos-pet-mvp`. É `C:\Users\wesley\Documents\Claude\Projects\sos-pet`.
- **F0 já foi feita.** O scaffold do antigo `Meu Saas` foi copiado pra cá: `package.json` (Next 15.1, React 19, TS 5.6, Tailwind 3.4, @supabase/ssr 0.5.2, supabase-js 2.45.4, lucide-react, zod 3.23), `app/`, `components/`, `lib/`, `supabase/`, `.env.local`. 31 arquivos migrados, paridade verificada com `diff`.
- **`Meu Saas` virou legado.** Pode ser apagado quando quiser (sandbox não conseguiu deletar `node_modules` por timeout — manual).
- **`npm install` precisou rodar no host.** Sandbox não termina o install em 45s. Foi feito direto no PowerShell.
- **Aguardando confirmação do `npm run dev`** subindo limpo antes de avançar pra F1.

## A1. Decisões de stack que já estão tomadas (não voltar atrás)

Marcadas como "decisões abertas" na seção 8 — agora são fato:

1. **Next 15.1 estável.** Não 16.
2. **Tailwind 3.4.** Não v4.
3. **npm.** Não pnpm. Lock já existe e o ambiente Windows do wes já tá calibrado pra npm.
4. **Sem migração de dados de prod.** O Supabase atual ainda não tem volume de produção que justifique backfill. Schema novo pode ser aplicado limpo.
5. **Vercel projeto novo.** Não substituir o do v2 — deployar paralelo, validar, então apontar domínio.

## A2. Schema real (substituir a seção 4)

A auditoria de `sos-pet-v2/src/database/migrations.sql` (217 linhas) revelou estruturas que o plano original tratou só como nomes. O schema consolidado precisa incluir:

**`prestadores` — colunas extras a portar:**
- `emergencia24h boolean default false`
- `delivery boolean default false`
- `verificado boolean default false` (selo)
- `agendamento_online boolean default false`
- `destaque boolean default false` (feature flag visual)
- `cidade text` (filtro)
- `slug text unique` (URL amigável `/prestadores/[slug]`)
- `media_avaliacoes numeric(3,2) default 0` (denormalizado, atualizado por trigger)
- `total_avaliacoes int default 0`
- `user_id uuid references auth.users(id)` (dono do perfil)

**`avaliacoes` — tabela nova:**
```sql
create table avaliacoes (
  id uuid primary key default gen_random_uuid(),
  prestador_id uuid references prestadores(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  nota int check (nota between 1 and 5),
  comentario text,
  created_at timestamptz default now()
);
-- RLS: SELECT público; INSERT só auth.uid()=user_id; UPDATE/DELETE só autor
```

**`prestador_stats` — métricas agregadas:**
```sql
create table prestador_stats (
  prestador_id uuid primary key references prestadores(id) on delete cascade,
  visualizacoes int default 0,
  cliques_whatsapp int default 0,
  total_avaliacoes int default 0,
  media_notas numeric(3,2) default 0,
  updated_at timestamptz default now()
);
```

**`avisos` — banner ticker no topo da landing:**
```sql
create table avisos (
  id uuid primary key default gen_random_uuid(),
  mensagem text not null,
  emoji text,
  link text,
  ativo boolean default true,
  prioridade int default 0,  -- maior aparece primeiro
  expires_at timestamptz,
  created_at timestamptz default now()
);
-- v2 já tem 3 seeds — portar
```

**`parceiros` — empresas parceiras (form da página /parcerias):**
```sql
create table parceiros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  empresa text,
  mensagem text,
  status text default 'pendente' check (status in ('pendente','aprovado','rejeitado')),
  created_at timestamptz default now()
);
```

**`pets` — coluna a adicionar:**
- `cidade text` (faltava no schema base, v2 já tem)

**Functions (SECURITY DEFINER) — portar literal:**
```sql
create or replace function incrementar_visualizacao_prestador(p_id uuid)
returns void language plpgsql security definer as $$
begin
  update prestador_stats set visualizacoes = visualizacoes + 1
  where prestador_id = p_id;
end; $$;

create or replace function incrementar_clique_whatsapp(p_id uuid)
returns void language plpgsql security definer as $$
begin
  update prestador_stats set cliques_whatsapp = cliques_whatsapp + 1
  where prestador_id = p_id;
end; $$;
```

**Trigger de média de avaliações:**
```sql
create or replace function atualizar_media_prestador()
returns trigger language plpgsql as $$
begin
  update prestador_stats
  set total_avaliacoes = (select count(*) from avaliacoes where prestador_id = NEW.prestador_id),
      media_notas = (select coalesce(avg(nota),0) from avaliacoes where prestador_id = NEW.prestador_id),
      updated_at = now()
  where prestador_id = NEW.prestador_id;
  return NEW;
end; $$;

create trigger trg_atualizar_media_prestador
after insert or update or delete on avaliacoes
for each row execute function atualizar_media_prestador();
```

## A3. Padrões do v2 que precisam ser preservados (vieram do AUDITORIA.md)

O `AUDITORIA.md` do v2 documenta 7 vulnerabilidades já corrigidas lá. Ignorar essas correções no scaffold novo seria regressão. Portar como utilities TS:

1. **`handleAuthError(error)`** — detecta tokens corrompidos (`"Invalid Refresh Token"`, `"refresh_token_not_found"`, `"invalid_grant"`, status 401) e faz auto-cleanup com `signOut({scope:'local'})` + `localStorage.removeItem`. Sem isso, sessão zumbi quebra a navegação silenciosamente.
2. **`getSessionSafe()` / `getUserSafe()`** — wrappers que envolvem `supabase.auth.getSession/getUser` e roteiam erros pelo `handleAuthError`. Usar **em vez de** chamar o client direto.
3. **Validação de env no boot.** Se `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` faltam, jogar erro descritivo no startup, não deixar o app subir e quebrar em runtime.
4. **Cleanup de `useEffect`.** v2 auditou 23 componentes garantindo que listeners (`auth.onAuthStateChange`, geolocation, intervalos, sockets) limpam no unmount. Padrão a manter no novo código TS.
5. **PKCE flow.** Já é o default do `@supabase/ssr` mas conferir `flowType: 'pkce'` na config explícita do client se houver suspeita.
6. **`emailRedirectTo` dinâmico.** Não hardcodar URL — usar `getBaseUrl()` que tenta `window.location.origin` no client, senão `process.env.NEXT_PUBLIC_SITE_URL` no server. Sem isso, links de confirmação quebram entre dev/preview/prod.
7. **`pre-deploy.sh`** — script que roda `tsc --noEmit && next build && grep -r "SUPABASE_SERVICE_ROLE" .` pra travar deploy se houver vazamento de secret. Portar como `scripts/pre-deploy.mjs` com mesma lógica (Node, cross-platform).

## A4. Features que faltavam no plano original — adicionar

### F2.5 — Central de Resgate / Botão SOS (est. 2h)

Faltou completamente no plano. v2 tem em `src/components/rescue/SOSButton.jsx` (282 linhas) + `src/lib/alerts/`.

**Componente `<SOSButton />`:**
- **Long-press 2s** pra disparar (evita toque acidental). `HOLD_DURATION = 2000`, `PROGRESS_INTERVAL = 20`.
- Vibração `navigator.vibrate(50)` ao iniciar press, `[100,50,100]` ao ativar.
- Visual: SVG com **progress ring** (`strokeDasharray` animado), 3 ondas concêntricas com `animate-ping` (1.5s/2s/2.5s defasadas), linha radial varrendo (`conic-gradient`), glow com `blur-xl` no fundo.
- Suporta touch + mouse events.

**Sistema `lib/alerts/`:**
- `generateAlertImage(petData)` — usa `html-to-image` `toPng` com `pixelRatio: 2` pra gerar card PNG compartilhável.
- `shareAlertImage(blob)` — Web Share API com fallback de download.
- `notifyUsersInRegion(geo)` — placeholder, será preenchido em fase futura (precisa de tabela `user_regions` e função PG).
- `publishToFacebook/Instagram/Twitter` — stubs com URL de share intent (sem OAuth no MVP).

**Schema novo:**
```sql
create table alertas_sos (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets(id) on delete cascade,
  user_id uuid references auth.users(id),
  raio_km int default 5,
  imagem_url text,
  status text default 'ativo',
  created_at timestamptz default now()
);
```

**Por que F2.5 e não F8.** O SOS é o diferencial emocional do produto. Faz sentido aparecer logo depois do CRUD de pets perdidos (F2), antes de gastar tempo em landing (F3) ou prestadores (F4).

### F4.5 — Avisos / Ticker (est. 30min)

Tabela `avisos` (ver A2). Componente `<AvisosTicker />` no topo da landing carrega top 3 ativos não expirados, ordenados por prioridade desc. Auto-rotaciona com fade.

### F4.6 — Página /parcerias (est. 30min)

Form com Zod (`nome`, `email`, `empresa`, `mensagem`) → Server Action → `insert into parceiros`. Status default `pendente`. Aprovação manual pelo admin (F7).

## A5. Fases revisadas (ordem sugerida pós-adendo)

| Fase | Escopo | Estimativa |
|---|---|---|
| ~~F0~~ | ~~Scaffold~~ — **DONE** | ~~45min~~ ✅ |
| **F1** | Auth completo + utilities (handleAuthError, getSessionSafe, getUserSafe, env guard, getBaseUrl, pre-deploy) | 2h |
| **F2** | Achados e Perdidos (CRUD, upload, filtros, RLS, edição owner-only) | 2h |
| **F2.5** | Central de Resgate (SOSButton, generateAlertImage, schema alertas_sos) | 2h |
| **F3** | Landing + páginas estáticas (dicas, termos, privacidade) | 1h30 |
| **F4** | Prestadores (schema completo da A2, listagem com filtros ricos, detalhe por slug, RPCs de stats) | 2h30 |
| **F4.5** | Avisos/Ticker | 30min |
| **F4.6** | Parcerias (form + tabela) | 30min |
| **F5** | Dashboard prestador (métricas reais, edição perfil, upload logo, listagem de avaliações) | 1h30 |
| **F6** | PWA + SEO + polish + Lighthouse ≥90 | 1h |
| **F7** | Admin (aprovar parceiros, moderar pets/prestadores, gerenciar avisos) | 1h30 |

**Total revisado:** ~15h (vs 10h original — diferença é F2.5, F4.5, F4.6 e expansão de F4/F7).

## A6. Fora do MVP (roadmap pós-MVP)

Itens que o wes mencionou no briefing inicial mas que ficam pra depois:

- Rastreamento GPS em tempo real (precisa hardware/app mobile)
- Mapa de calor de avistamentos (`sightings` agregado por geohash)
- Tags QR físicas (geração + redirecionamento curto)
- Marketplace / loja interna (Stripe + dropshipping)
- Matching automático perdido↔encontrado (vetor de similaridade na descrição + raio)
- Notificações push WhatsApp via Twilio/Z-API
- Moderação automática com IA (vision API pra rejeitar fotos inadequadas)

## A7. Por onde começar — escolhe um

Como o scaffold tá pronto e o `npm run dev` deve estar subindo, próximo passo é uma destas:

- **A) F1 — Auth completo.** Login, registro, callback PKCE, middleware de proteção, utilities de erro/env. Base pra tudo que vem depois precisar de usuário logado.
- **B) F2 — Achados e Perdidos completo.** Pular auth por enquanto (cadastro anônimo permitido), focar no CRUD com upload, filtros e RLS. Faz sentido se quiser ver a tela "principal" funcionando antes.
- **C) F2.5 — Central de Resgate primeiro.** Vai direto pro diferencial emocional (SOSButton + alerta com card compartilhável). Mais "wow" pra demo, mas depende parcialmente do schema de pets de F2.
- **D) F1 + F2 combo.** Auth + CRUD em sequência sem pausa. Mais trabalho num bloco só, mas resultado é um MVP usável de verdade.

Recomendo **A → B → C** nessa ordem, mas sem combo — cada fase termina com critério de pronto verificável antes da próxima.
