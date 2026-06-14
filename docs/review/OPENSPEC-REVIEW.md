# OPENSPEC REVIEW — Pet Aumigo
**Metodologia**: Spec-anchored · OpenSpec Brownfield
**Equipe**: auditor + implementer + verifier (3 agentes paralelos)
**Data**: 2026-06-08

---

## RESUMO EXECUTIVO

O projeto Pet Aumigo tem um **codebase sólido e funcional** — módulo ONG 100% implementado com 66 testes passando, RLS ativo em todas as tabelas, contratos de segurança de dados corretos nas rotas públicas principais. O problema não é o código: é que o **CLAUDE.md virou uma âncora falsa** — descreve um projeto que não existe mais.

| Dimensão | Estado Real |
|----------|-------------|
| Módulo ONG (T1–T10) | ✅ 100% implementado e testado |
| RLS nas tabelas ONG | ✅ Todas com ENABLE ROW LEVEL SECURITY |
| Contato tutor em listagens públicas | ✅ Correto — `pets_public` view protege |
| Schema `pets` no CLAUDE.md | ❌ Completamente desatualizado (PT-BR vs EN real) |
| Rate limiting em produção | ⚠️ Parcial — Upstash não configurado = zero proteção |
| Componentes documentados | ❌ `PetCardFuturistic.jsx` não existe |
| Bugs de formato de resposta | ❌ 7 rotas com contrato errado |
| `select('*')` no codebase | ❌ 11 ocorrências (2 críticas, 9 médias/baixas) |

---

## PARTE 1 — ITENS CRÍTICOS (corrigir antes do próximo deploy)

### C1 · Vazamento de `adopter_phone` na listagem `/ong/adocoes`
**Origem**: RED-TEAM VULN-001 + BUG-HUNT BUG-001 (confirmado por 2 agentes)
**EARS**: SE um usuário acessa `GET /ong/adocoes` ENTÃO O SISTEMA DEVE omitir `adopter_phone` e `adopter_email` do select, retornando-os apenas em `GET /ong/adocoes/[id]`.

**Specify**: A listagem de adoções da ONG nunca deve expor dados de contato do adotante. Violação de LGPD arts. 6 e 18.
**Plan**: Remover `adopter_phone` do `.select()` em `app/ong/adocoes/page.tsx:46`. Remover render na linha correspondente da listagem.
**Tasks**:
- [ ] `app/ong/adocoes/page.tsx` — remover `adopter_phone`, `adopter_email` do select
- [ ] Verificar se a página de detalhe `/ong/adocoes/[id]` exibe corretamente

---

### C2 · Rate limiting in-memory bypassa em Vercel serverless
**Origem**: RED-TEAM VULN-002 (confirmado por DELTA-AUDIT)
**EARS**: SE a aplicação inicializa em `NODE_ENV=production` sem `UPSTASH_REDIS_REST_URL` configurada ENTÃO O SISTEMA DEVE lançar erro fatal e bloquear o deploy.

**Specify**: O fallback `Map` em `lib/rate-limit.ts:62-88` é invisível em produção. Cada instância serverless tem Map separado → rate limiting efetivamente zero. Atacante distribui requests entre instâncias.
**Plan**:
1. Adicionar verificação de startup em `lib/rate-limit.ts` que joga erro se `NODE_ENV=production` e `UPSTASH_REDIS_REST_URL` ausente
2. Configurar `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` nas variáveis da Vercel
**Tasks**:
- [ ] `lib/rate-limit.ts` — adicionar guard de startup
- [ ] Vercel dashboard — configurar variáveis Upstash
- [ ] Testar rate limit em preview deploy

---

### C3 · `select('*')` crítico em admin — expõe `contact_phone`
**Origem**: RED-TEAM VULN-003 + BUG-HUNT BUG-001/002
**EARS**: SE qualquer query seleciona dados da tabela `pets` ENTÃO O SISTEMA DEVE usar colunas explícitas excluindo `contact_*`, exceto em páginas de detalhe individual.

**Tasks**:
- [ ] `app/admin/pets/page.tsx:24` — substituir `select("*")` por colunas explícitas
- [ ] `app/admin/prestadores/page.tsx:22` — idem

---

## PARTE 2 — ITENS ALTOS (corrigir neste sprint)

### A1 · RPC `get_pet_contact` sem rate limiting — scraping de telefones
**Origem**: RED-TEAM VULN-004
**EARS**: SE um usuário chama a RPC `get_pet_contact` mais de 10 vezes por hora ENTÃO O SISTEMA DEVE retornar 429 Too Many Requests.
**Task**: Adicionar `checkRateLimit` no Server Action que chama a RPC. Limite: 10/hora por IP.

---

### A2 · 4 rotas sem rate limiting (spec T1–T4 pendentes)
**Origem**: RED-TEAM VULN-005 + DELTA-AUDIT
**Arquivos**: `lost-active`, `user/export-data`, `ong/*`, `sync/printful`
**EARS**: SE qualquer rota de API pública recebe mais de N requests por janela de tempo ENTÃO O SISTEMA DEVE retornar 429 com header `Retry-After`.
**Task**: Implementar tasks T1–T4 de `specs/rate-limiting/tasks.md`

---

### A3 · Lógica de overdue INVERTIDA no dashboard ONG
**Origem**: BUG-HUNT BUG-013
**EARS**: SE o dashboard exibe KPI de "acompanhamentos atrasados" ENTÃO O SISTEMA DEVE usar `isFollowUp30Overdue()` da lib centralizada — não lógica inline inversa.
**Impacto**: KPIs do dashboard mostram números errados — falso positivo para adoções com acompanhamento feito.
**Task**: `app/ong/dashboard/page.tsx:344-345` — substituir lógica inline por `isFollowUp30Overdue` / `isFollowUp90Overdue`

---

### A4 · Race condition no webhook de adoção
**Origem**: BUG-HUNT BUG-005
**EARS**: SE uma adoção é inserida ENTÃO O SISTEMA DEVE capturar o `id` do próprio INSERT, nunca via query secundária.
**Task**: `app/ong/adocoes/actions.ts` — mudar para `.insert({...}).select("id").single()`

---

### A5 · Formato de resposta inconsistente em 7 rotas
**Origem**: BUG-HUNT BUG-003/010/011
**EARS**: Toda rota de API DEVE retornar `{ success: boolean, data?: unknown, error?: string }`.
**Arquivos**:
- `app/api/ong/adoption/[id]/route.ts`
- `app/api/ong/available-pets/route.ts`
- `app/api/pets/lost-active/route.ts`
- `app/api/sync/printful/route.ts`
**Task**: Usar helpers `ok()` e `fail()` de `@/lib/api-response` em todas as rotas

---

### A6 · IP spoofing bypassa rate limiting via `x-forwarded-for`
**Origem**: RED-TEAM VULN-009
**EARS**: SE o rate limiter identifica o cliente por IP ENTÃO O SISTEMA DEVE usar `x-real-ip` ou `x-vercel-forwarded-for` — não `x-forwarded-for` (manipulável pelo cliente).
**Task**: `lib/rate-limit.ts:110-117` — trocar header de IP

---

### A7 · Encoding incorreto em mensagens de erro
**Origem**: BUG-HUNT BUG-007
**Task**: `app/ong/pets/[id]/medicacoes/actions.ts:31-32` e `vacinas/actions.ts:27-28` — corrigir `"Nao autenticado."` → `"Não autenticado."` e `"Sem permissao."` → `"Sem permissão."`

---

## PARTE 3 — ITENS MÉDIOS (backlog próxima semana)

| # | Arquivo | Problema |
|---|---------|---------|
| M1 | `app/sentinela/novo/actions.ts:56` | Sem Turnstile — bots podem poluir mapa |
| M2 | `app/avistamentos/actions.ts:41` | Sem Turnstile — avistamentos falsos |
| M3 | `app/api/sync/printful/route.ts:61-71` | Handler GET expõe blueprint de ataque |
| M4 | 9 arquivos com `select("*")` não crítico | Ver BUG-004/008/009/015/016 |
| M5 | `app/ong/dashboard/page.tsx` | Lógica overdue inline (derivado do A3) |
| M6 | `app/pets/[id]/page.tsx:110` | Cast `any` sem justificativa |

---

## PARTE 4 — ATUALIZAÇÃO URGENTE DO CLAUDE.md

O CLAUDE.md está funcionando como especificação incorreta. Toda sessão nova recebe instrução errada.

### 4.1 · Schema `pets` — substituir completamente

**Atual (ERRADO)**:
```sql
-- nome TEXT, especie TEXT, status CHECK IN ('perdido','encontrado','resolvido')
```

**Real (CORRETO)**:
```sql
-- name TEXT, species TEXT, kind TEXT CHECK IN ('lost','found')
-- status TEXT CHECK IN ('active','resolved')
```

### 4.2 · Componentes — substituir

**Atual (ERRADO)**: `PetCardFuturistic.jsx` / `PetCard.js`
**Real (CORRETO)**: `components/pets/PetCard.tsx` (TypeScript, props modernas)

### 4.3 · Rotas — corrigir

**Atual**: `/auth/login`
**Real**: `/login`

### 4.4 · Variáveis de ambiente — adicionar ao CLAUDE.md

```
SUPABASE_SERVICE_ROLE_KEY      → server-only, nunca NEXT_PUBLIC_
UPSTASH_REDIS_REST_URL         → obrigatório em produção
UPSTASH_REDIS_REST_TOKEN       → obrigatório em produção
N8N_ADOPTION_WEBHOOK_URL       → webhook adoções ONG
MP_ACCESS_TOKEN                → Mercado Pago (server-only)
MP_WEBHOOK_SECRET              → validação HMAC webhook MP
PRINTFUL_API_KEY               → integração loja
SYNC_TOKEN                     → autenticação sync Printful
TURNSTILE_SECRET_KEY           → anti-bot (server-only)
NEXT_PUBLIC_TAG_PRICE_BRL      → preço tag na loja
RESEND_FROM                    → remetente email (era FROM_EMAIL)
```

### 4.5 · Módulos novos — documentar rotas

```
/login                    → Auth (route group (auth))
/loja                     → Loja física (Printful + Mercado Pago)
/loja/[id]                → Detalhe de produto
/sentinela/novo           → Cadastro de câmera na Rede Sentinela
/avistamentos/novo        → Registro de avistamento de pet
/perfil/[id]              → Perfil público de usuário
/dashboard-prestador      → Dashboard do prestador de serviços
/admin/*                  → Painel admin (protegido)
/ong/*                    → Módulo ONG completo (T1–T10)
/[type]-em-[city]         → SEO dinâmico por cidade/espécie
```

---

## PARTE 5 — PONTOS FORTES CONFIRMADOS

Itens que estão corretos e não devem ser tocados:

- `contact_phone` **não vaza** nas listagens públicas — view `pets_public` + select explícito funcionam
- `SUPABASE_SERVICE_ROLE_KEY` não exposto em nenhum arquivo cliente
- RLS ativo em todas as tabelas do módulo ONG
- Webhook Mercado Pago com validação HMAC-SHA256 correta
- XSS em JSON-LD mitigado via `JSON.stringify()`
- Rate limiting funcional em `/api/pets` e `/api/pets/[id]`
- Módulo ONG completo com 66 testes passando
- `await params` e `await cookies()` corretos em todo o codebase

---

## PLANO DE EXECUÇÃO SUGERIDO

```
Sprint atual (esta semana):
  C1 — Remover adopter_phone da listagem ONG
  C3 — Fix select('*') crítico em admin
  A3 — Fix lógica overdue invertida no dashboard
  A7 — Fix encoding PT-BR

Sprint seguinte:
  C2 — Configurar Upstash + guard de startup
  A1 — Rate limit na RPC get_pet_contact
  A2 — Implementar T1-T4 de rate-limiting spec
  A4 — Fix race condition webhook adoção
  A5 — Fix formato de resposta 7 rotas
  A6 — Fix IP spoofing no rate limiter

Backlog:
  M1-M6 — Turnstile em sentinela/avistamentos, select(*) não críticos

CLAUDE.md:
  Atualização estrutural urgente (schema, componentes, rotas, variáveis)
  Pode ser feita em paralelo com qualquer sprint
```
