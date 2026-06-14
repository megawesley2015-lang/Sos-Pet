# AGENTS.md — Pet Aumigo
# Mapa de harness para agentes de IA (Claude Code, Codex, etc.)
# Versão: 2.0.0 | Atualizado: 2026-05-31
# ─────────────────────────────────────────────────────────────
# LEIA ESTE ARQUIVO PRIMEIRO. É o mapa, não a enciclopédia.
# Para detalhes completos, siga os ponteiros abaixo.
# ─────────────────────────────────────────────────────────────

## Stack (versões fixas — não atualizar sem aprovação explícita)

```
Next.js 16.1.1  │  React 19.2.3  │  TypeScript strict
Tailwind CSS 3  │  Supabase (Postgres + Auth + Storage)
Vercel deploy   │  Zod validation │  Vitest 2 testes
```

→ Detalhes completos: `CLAUDE.md` e `ARCHITECTURE.md`

---

## Estrutura do projeto (onde fica o quê)

```
app/              → Rotas Next.js por feature (App Router)
  (auth)/         → Login, registro, recuperação de senha
  (marketing)/    → Landing, dicas, termos, privacidade
  admin/          → Painel admin (role='admin' obrigatório)
  achados-e-perdidos/ → Listagem + detalhe de pets
  avistamentos/   → Pets encontrados por terceiros
  loja/           → E-commerce (plaquinhas, produtos)
  mapa/           → Mapa interativo Leaflet
  meus-pets/      → Dashboard do tutor logado
  ong/            → Módulo de ONGs (migration pendente)
  prestadores/    → Diretório de prestadores de serviço

components/       → Componentes React reutilizáveis
  ui/             → Primitivos (Button, Input, Modal, Badge)
  pets/           → Cards, filtros, formulários de pet
  rescue/         → SOSButton, geração de alerta PNG
  layout/         → Header, Footer, TopBar

lib/
  supabase/       → server.ts (SSR) | client.ts (browser)
  validation/     → Schemas Zod por entidade
  services/       → Integações externas (email, mercadopago, printful)
  utils/          → Funções puras (format, cn, url)

supabase/
  migrations/     → Histórico de SQL versionado
  schema.sql      → Schema completo atual
```

---

## Regras obrigatórias (não negociáveis)

```
BANCO
  ✗ CREATE TABLE sem ENABLE ROW LEVEL SECURITY
  ✗ IDs inteiros — sempre UUID gen_random_uuid()
  ✗ SELECT * em qualquer query — sempre colunas explícitas
  ✗ service_role key no código cliente ou NEXT_PUBLIC_*
  ✓ ALTER TABLE quando tabela já existe (nunca recriar)
  ✓ RLS: SELECT público em pets/prestadores; resto autenticado

CÓDIGO
  ✗ cookies() sem await — Next.js 16 exige await
  ✗ params sem await em Route Handlers — sempre await params
  ✗ any sem comentário justificando
  ✗ Import sem alias @/ (usar @/lib, @/components, etc.)
  ✓ Encoding UTF-8 — acentos diretos, nunca entidades HTML
  ✓ Server Components → @/lib/supabase/server
  ✓ Client Components → @/lib/supabase/client

NEGÓCIO
  ✗ campo `contato` visível fora de /achados-e-perdidos/[id]
  ✗ Deletar fisicamente pets — usar status='resolvido'
  ✓ Paleta de cores intocável sem aprovação explícita do Wes
```

---

## Antes de escrever qualquer código

1. Confirmar que a tabela existe em `supabase/schema.sql`
2. Confirmar que o componente não existe em `components/`
3. Verificar se a rota não existe em `app/`
4. Para features novas: existe spec em `.claude/specs/<feature>/`?

---

## Verification loop — rode antes de qualquer commit

```bash
npm run typecheck   # TypeScript sem erros
npm run lint        # ESLint
npm run test        # Vitest (73 testes devem passar)
npm run build       # Build Next.js limpo
```

O CI no GitHub Actions roda tudo isso automaticamente. Se quebrar, o deploy na Vercel é bloqueado.

---

## Quando PARAR e perguntar ao Wes

- A feature pedida não está em `.claude/specs/` e não está listada em `CLAUDE.md`
- A mudança afeta RLS, schema ou autenticação de forma não óbvia
- Há ambiguidade sobre se algo está dentro ou fora do MVP
- O build quebrou e o fix não é trivial (1-2 linhas)

Parar e perguntar é mais rápido do que reparar uma decisão errada.

---

## Specs ativas

→ Veja `.claude/specs/` para o plano de execução de cada feature em andamento.
→ Features planejadas mas não especificadas: `PLANO-CONSOLIDACAO-sos-pet-mvp.md`

---

## Módulos com estado especial

```
app/ong/          → Código criado, migration SQL NÃO aplicada ainda
                    Arquivo: supabase/migrations/001_ong_module.sql

loja/             → Printful + Mercado Pago integrados
                    Requer: PRINTFUL_API_KEY, MERCADOPAGO_ACCESS_TOKEN

sentinela/        → Monitoramento de alertas (experimental)
```

---

*Para contexto completo do projeto, leia `CLAUDE.md`.*
*Atualizar este arquivo após mudanças estruturais.*
