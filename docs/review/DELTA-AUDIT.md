# DELTA-AUDIT — Pet Aumigo
**Agente**: auditor | **Metodologia**: OpenSpec Spec-anchored
**Resumo**: 8 rotas ✅ / 1 nome errado ⚠️ / 5 gaps ❌ | CLAUDE.md desatualizado estruturalmente

---

## DESCOBERTA CRÍTICA: Schema `pets` completamente desatualizado no CLAUDE.md

O CLAUDE.md descreve o schema em PT-BR (`nome`, `especie`, `status IN ('perdido','encontrado','resolvido')`) mas o banco real usa schema em inglês com campos diferentes:
- `name` (não `nome`), `species` (não `especie`), `kind` (`lost`/`found`, não `status`)
- `status` real: `active`/`resolved` (não `perdido`/`encontrado`/`resolvido`)

**Impacto**: Qualquer instrução do CLAUDE.md para queries na tabela `pets` gera código incompatível com o banco real.

---

## ROTAS

| Rota (CLAUDE.md) | Status | Observação |
|------------------|--------|------------|
| `/` | ✅ | `app/(marketing)/page.tsx` |
| `/achados-e-perdidos` | ✅ | `app/achados-e-perdidos/page.tsx` |
| `/achados-e-perdidos/novo` | ✅ | `app/achados-e-perdidos/novo/page.tsx` |
| `/achados-e-perdidos/[id]` | ✅ | Contato isolado corretamente |
| `/auth/login` | ⚠️ NOME ERRADO | Rota real é `/login` (route group `(auth)`) |
| `/auth/callback` | ✅ | `app/auth/callback/route.ts` |
| `GET+POST /api/pets` | ✅ + rate limit | `app/api/pets/route.ts` |
| `GET+PATCH+DELETE /api/pets/[id]` | ✅ + rate limit no GET | `app/api/pets/[id]/route.ts` |

---

## COMPONENTES

| Componente (CLAUDE.md) | Status | Observação |
|------------------------|--------|------------|
| `PetCardFuturistic.jsx` | ❌ NÃO EXISTE | Componente documentado inexistente |
| `PetCard.js` (legado) | ❌ NÃO EXISTE | Componente real: `components/pets/PetCard.tsx` com props TypeScript completamente diferentes |

**Componente real**: `components/pets/PetCard.tsx` — props TypeScript modernas, não correspondem à spec.

---

## MÓDULO ONG — Tasks vs Código

| Task | Status Spec | Código confirma? |
|------|-------------|-----------------|
| T1 – Schema ONG | ✅ | ✅ Confirmado |
| T2 – CRUD Shelter Pets | ✅ | ✅ Confirmado (critério aceite não marcado no tasks.md) |
| T3 – Prontuário médico | ✅ | ✅ Confirmado |
| T4 – Vacinas | ✅ | ✅ Confirmado |
| T5 – Medicações + badge Contínua | ✅ | ✅ Confirmado |
| T6 – Adoções | ✅ | ✅ Confirmado |
| T7 – Webhook n8n | ✅ | ✅ Confirmado |
| T8 – Badges Pendente/Atrasado/Realizado | ✅ | ✅ Confirmado |
| T9 – Follow-up 30/90 dias | ✅ | ✅ Confirmado |
| T10 – Tipos TypeScript gerados | ✅ | ✅ `database.ts` presente — 66/66 testes |

---

## RATE LIMITING — Status Real

| Rota | Status | Spec |
|------|--------|------|
| `GET /api/pets` | ✅ Implementado | — |
| `POST /api/pets` | ✅ Implementado | — |
| `GET /api/pets/[id]` | ✅ Implementado | — |
| `GET /api/pets/lost-active` | ❌ Pendente | T1 `specs/rate-limiting/tasks.md` |
| `GET /api/user/export-data` | ❌ Pendente (método errado: GET vs POST da spec) | T2 |
| `GET /api/ong/*` | ❌ Pendente | T3 |
| `POST /api/sync/printful` | ❌ Pendente | T4 |
| Header `X-RateLimit-Remaining` | ❌ Ausente em todas as rotas | T5 |

**Problema crítico**: `lib/rate-limit.ts` usa `Map` in-memory como fallback. Na Vercel serverless, cada instância tem Map separado → rate limiting zero se Upstash não estiver configurado.

---

## VARIÁVEIS DE AMBIENTE NÃO DOCUMENTADAS

Usadas no código mas ausentes no CLAUDE.md:

| Variável | Onde usada |
|----------|------------|
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/service.ts` |
| `UPSTASH_REDIS_REST_URL` | `lib/rate-limit.ts` |
| `UPSTASH_REDIS_REST_TOKEN` | `lib/rate-limit.ts` |
| `N8N_ADOPTION_WEBHOOK_URL` | `app/ong/adocoes/actions.ts` |
| `MP_ACCESS_TOKEN` | integração Mercado Pago |
| `MP_WEBHOOK_SECRET` | validação HMAC webhook MP |
| `PRINTFUL_API_KEY` | integração loja |
| `SYNC_TOKEN` | `app/api/sync/printful/route.ts` |
| `TURNSTILE_SECRET_KEY` | proteção anti-bot |
| `NEXT_PUBLIC_TAG_PRICE_BRL` | loja |
| `RESEND_FROM` | email (CLAUDE.md usa `FROM_EMAIL`) |
| `NEXT_PUBLIC_APP_URL` | alias legado de `NEXT_PUBLIC_SITE_URL` |
| `VERCEL_URL` | fallback de URL |

---

## ADDITIONS NÃO DOCUMENTADAS (codebase cresceu além do CLAUDE.md)

Módulos implementados mas não declarados no CLAUDE.md:

- **Loja** (Printful + Mercado Pago): `app/loja/`, `app/api/sync/printful/`, webhooks MP
- **Módulo Admin**: `app/admin/` — pets, prestadores, sentinela, parceiros, loja, avistamentos
- **Rede Sentinela**: `app/sentinela/` — cadastro de câmeras de monitoramento
- **Avistamentos**: `app/avistamentos/` — registro de pets vistos
- **Módulo Prestadores** expandido: avaliações, dashboards, `/dashboard-prestador/`
- **Perfil público**: `app/perfil/[id]/`
- **Rota SEO dinâmica**: `app/[type]-em-[city]/` — landing pages por cidade/espécie
- **10+ migrations** não documentadas no CLAUDE.md

---

## GAPS CRÍTICOS (EARS)

- **QUANDO** o Claude lê o schema `pets` no CLAUDE.md **O SISTEMA DEVE** refletir o schema real em inglês → ❌ GAP: schema completamente desatualizado
- **QUANDO** um componente de card de pet é necessário **O SISTEMA DEVE** usar `components/pets/PetCard.tsx` → ❌ GAP: CLAUDE.md aponta `PetCardFuturistic.jsx` que não existe
- **QUANDO** o desenvolvedor usa a rota `/auth/login` declarada **O SISTEMA DEVE** estar disponível → ⚠️ PARCIAL: rota existe em `/login`
- **QUANDO** Upstash não está configurado em produção **O SISTEMA DEVE** bloquear o deploy → ❌ GAP: fallback in-memory silencioso
