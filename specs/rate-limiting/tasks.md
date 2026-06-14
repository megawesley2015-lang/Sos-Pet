# Tasks — Rate Limiting
# SDD Fase 3: DECOMPOR (micro-tarefas independentes e verificáveis)
# Notação: EARS por tarefa + Harness Command + Critério de Aceite
# ─────────────────────────────────────────────────────────────────
# Status geral: ⚠️ Parcialmente implementado — pets/* OK, resto descoberto
# Referências: spec.md · lib/rate-limit.ts (já existe)
# ─────────────────────────────────────────────────────────────────

---

## T1 — Rate limit em `/api/pets/lost-active`

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Concluído — 2026-06-10
**Arquivo:** `app/api/pets/lost-active/route.ts`

### Especificação EARS

WHEN qualquer cliente acessa `GET /api/pets/lost-active`
THE SYSTEM SHALL aplicar sliding window de 30 requests/min por IP.

IF o limite for excedido
THEN THE SYSTEM SHALL retornar 429 com `{ success: false, error: "...", code: "RATE_LIMITED" }` e header `Retry-After`.

### Harness Commands

```bash
npm run typecheck
grep -n "checkRateLimit" app/api/pets/lost-active/route.ts
```

### Critério de Aceite

- [ ] `checkRateLimit` chamado antes de qualquer query Supabase
- [ ] Response 429 com body JSON e header `Retry-After`
- [ ] Typecheck passa

---

## T2 — Rate limit em `/api/user/export-data`

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Concluído — 2026-06-10
**Arquivo:** `app/api/user/export-data/route.ts`

### Especificação EARS

WHEN um usuário acessa `POST /api/user/export-data`
THE SYSTEM SHALL aplicar sliding window de 2 requests por hora por IP.

IF o limite for excedido
THEN THE SYSTEM SHALL retornar 429 ANTES de processar qualquer query ao banco.

### Harness Commands

```bash
npm run typecheck
grep -n "checkRateLimit" app/api/user/export-data/route.ts
```

### Critério de Aceite

- [ ] Limite de 2 req/hora (windowMs: 3_600_000)
- [ ] Rate check é o PRIMEIRO statement da função (antes de auth check)
- [ ] Typecheck passa

---

## T3 — Rate limit nos endpoints ONG autenticados

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Concluído — 2026-06-10
**Arquivos:** `app/api/ong/adoption/[id]/route.ts` · `app/api/ong/available-pets/route.ts`

### Especificação EARS

WHEN um cliente acessa qualquer endpoint `GET /api/ong/*`
THE SYSTEM SHALL aplicar sliding window de 60 requests/min por IP.

### Harness Commands

```bash
npm run typecheck
grep -n "checkRateLimit" app/api/ong/adoption/\[id\]/route.ts app/api/ong/available-pets/route.ts
```

### Critério de Aceite

- [ ] Ambas as rotas têm `checkRateLimit` antes de auth check
- [ ] Limite: 60 req/min (mais relaxado — endpoints autenticados)
- [ ] Typecheck passa

---

## T4 — Rate limit em `/api/sync/printful`

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Concluído — 2026-06-10
**Arquivo:** `app/api/sync/printful/route.ts`

### Especificação EARS

WHEN `POST /api/sync/printful` é chamado
THE SYSTEM SHALL aplicar sliding window de 10 requests/hora por IP.

### Harness Commands

```bash
npm run typecheck
grep -n "checkRateLimit" app/api/sync/printful/route.ts
```

### Critério de Aceite

- [ ] Limite: 10 req/hora (windowMs: 3_600_000)
- [ ] Rate check antes de processar o sync
- [ ] Typecheck passa

---

## T5 — Headers `X-RateLimit-Remaining` em todas as rotas cobertas

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Concluído — 2026-06-10
**Arquivo:** `lib/rate-limit.ts`

### Especificação EARS

THE SYSTEM SHALL incluir header `X-RateLimit-Remaining: <N>` em todos os responses
de rotas com rate limiting ativo (200 e 429).

IF o response for 429
THE SYSTEM SHALL incluir `Retry-After: <segundos>` calculado a partir de `resetAt`.

### Implementação sugerida

Adicionar helper em `lib/rate-limit.ts`:
```typescript
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': String(result.remaining),
  }
  if (!result.allowed) {
    headers['Retry-After'] = String(Math.ceil((result.resetAt - Date.now()) / 1000))
  }
  return headers
}
```

### Harness Commands

```bash
npm run typecheck
npx vitest run rate
```

### Critério de Aceite

- [ ] `rateLimitHeaders()` exportada de `lib/rate-limit.ts`
- [ ] Rotas T1–T4 usam `rateLimitHeaders()` nos responses
- [ ] `npx vitest run rate` → testes da função passam
- [ ] Typecheck passa

---

## T6 — Testes unitários do rate limiter

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Concluído — 2026-06-10
**Arquivo:** `__tests__/rate-limiting/rate-limit.test.ts`

### Especificação EARS

THE SYSTEM SHALL ter testes cobrindo:
- `checkInMemory` permite até o limite e bloqueia ao exceder
- `checkInMemory` reseta após a janela expirar
- `rateLimitHeaders` retorna headers corretos para allowed e blocked
- `getClientIp` extrai IP de `x-forwarded-for` e fallback para `x-real-ip`

### Harness Commands

```bash
npx vitest run rate
npm run typecheck
```

### Critério de Aceite

- [ ] Testes cobrem happy path e bloqueio
- [ ] Testa reset da janela temporal
- [ ] `npx vitest run rate` → todos passam
- [ ] Typecheck passa

---

## Ordem de Execução

```
T5 (helper headers) → T6 (testes) → T1 → T2 → T3 → T4

T5 primeiro porque T1–T4 vão usar rateLimitHeaders().
T6 garante a lógica antes de aplicar.
T1–T4 podem rodar em paralelo após T5+T6.
```

## Harness Global

```bash
npm run typecheck
npx vitest run rate
```

## Limites de Referência

| Rota | Limite | Janela | Justificativa |
|------|--------|--------|---------------|
| `GET /api/pets` | 30 | 1 min | Listagem pública, anti-scraping |
| `POST /api/pets` | 5 | 1 min | Cadastro, anti-spam |
| `GET /api/pets/[id]` | 20 | 1 min | Detalhe com contato |
| `GET /api/pets/lost-active` | 30 | 1 min | Feed de apps terceiros |
| `POST /api/user/export-data` | 2 | 1 hora | LGPD, operação pesada |
| `GET /api/ong/*` | 60 | 1 min | Autenticado, uso legítimo alto |
| `POST /api/sync/printful` | 10 | 1 hora | API externa com custo |

---

*Gerado via SDD Fase 3 | Referências: spec.md · lib/rate-limit.ts*
