# Spec — Rate Limiting
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# ─────────────────────────────────────────────────────
# Status: ⚠️ Parcialmente implementado (pets/* cobertos, resto descoberto)
# Slug: rate-limiting
# Responsável: Wes
# Data: 2026-06-08

---

## Contexto de Negócio

O SOS Pet Aumigo é uma plataforma pública com endpoints que retornam dados sensíveis
(contatos de tutores, histórico veterinário) e operações custosas (GDPR export,
sync com Printful). Sem rate limiting distribuído, qualquer instância serverless
na Vercel opera com estado isolado — um atacante pode scraping ilimitado de
contatos ou forçar brute-force.

**Dívida técnica documentada no CLAUDE.md:**
> "Sem rate limiting nas rotas /api → implementar Upstash Ratelimit"

**Impacto de não ter:**
- Scraping de `contact_phone` via `/api/pets/lost-active`
- Abuso de `/api/user/export-data` para dump de dados LGPD
- Spam de cadastros via `/api/pets` POST (já coberto, mas sem fallback distribuído)

---

## Estado Atual

| Rota | Método | Rate Limit | Observação |
|------|--------|-----------|------------|
| `/api/pets` | GET | ✅ 30/min | Sliding window por IP |
| `/api/pets` | POST | ✅ 5/min | Sliding window por IP |
| `/api/pets/[id]` | GET | ✅ 20/min | Sliding window por IP |
| `/api/pets/lost-active` | GET | ❌ Ausente | Endpoint público scrapeable |
| `/api/user/export-data` | POST | ❌ Ausente | Operação pesada, dado sensível |
| `/api/ong/adoption/[id]` | GET | ❌ Ausente | Autenticado, risco menor |
| `/api/ong/available-pets` | GET | ❌ Ausente | Autenticado, risco menor |
| `/api/sync/printful` | POST | ❌ Ausente | Tem auth token, risco médio |
| `/api/webhook/mercadopago` | POST | ⚠️ N/A | Usa assinatura HMAC — não rate-limitar |
| `/api/dev/seed-ong` | GET/POST | ⚠️ Dev | Apenas dev — baixa prioridade |

---

## Requisitos — Notação EARS

### 2.1 Endpoint público de pets ativos (`/api/pets/lost-active`)

WHEN qualquer cliente acessa `GET /api/pets/lost-active`
THE SYSTEM SHALL aplicar sliding window de 30 requests por minuto por IP.

IF o limite for excedido
THEN THE SYSTEM SHALL retornar HTTP 429 com body `{ success: false, error: "Muitas requisições. Tente novamente em alguns instantes.", code: "RATE_LIMITED" }` e header `Retry-After: <segundos>`.

### 2.2 Export de dados LGPD (`/api/user/export-data`)

WHEN um usuário autenticado acessa `POST /api/user/export-data`
THE SYSTEM SHALL aplicar sliding window de 2 requests por hora por IP.

IF o limite for excedido
THEN THE SYSTEM SHALL retornar HTTP 429 antes de processar qualquer query ao banco.

### 2.3 Endpoints ONG autenticados

WHEN um cliente acessa `GET /api/ong/adoption/[id]` ou `GET /api/ong/available-pets`
THE SYSTEM SHALL aplicar sliding window de 60 requests por minuto por IP.

IF o limite for excedido
THEN THE SYSTEM SHALL retornar HTTP 429 com o mesmo formato padrão.

### 2.4 Sync Printful (`/api/sync/printful`)

WHEN `POST /api/sync/printful` é chamado
THE SYSTEM SHALL aplicar sliding window de 10 requests por hora por IP
(operação de sync é pesada e tem custo na API do Printful).

IF o limite for excedido
THEN THE SYSTEM SHALL retornar HTTP 429 sem processar o sync.

### 2.5 Headers de resposta

THE SYSTEM SHALL incluir nos responses de rotas rate-limitadas:
- `X-RateLimit-Remaining: <N>` — requests restantes na janela atual
- `Retry-After: <segundos>` — apenas quando 429

### 2.6 Comportamento em falha do Upstash

IF a conexão com Upstash Redis falhar (timeout, rede)
THEN THE SYSTEM SHALL fazer fallback para o rate limiter in-memory e
logar o erro sem bloquear o request.

THE SYSTEM SHALL NEVER retornar 500 por falha no rate limiter.

### 2.7 Ambientes

THE SYSTEM SHALL usar Upstash Redis em produção (estado compartilhado entre instâncias Vercel).

WHEN `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` não estiverem configuradas
THE SYSTEM SHALL usar rate limiter in-memory (dev local — não compartilhado entre instâncias).

---

## Critérios de Aceitação

- [ ] `GET /api/pets/lost-active` retorna 429 após 30 requests/min do mesmo IP
- [ ] `POST /api/user/export-data` retorna 429 após 2 requests/hora
- [ ] Headers `X-RateLimit-Remaining` presentes em todas as rotas cobertas
- [ ] Falha no Upstash não causa 500 (fallback in-memory)
- [ ] `npm run typecheck` → 0 erros
- [ ] `npx vitest run rate` → testes da lógica de limite passam
