---
name: rate-limiting-completo
status: done
priority: 1
depends_on: []
completed_at: 2026-06-15
---

# Rate Limiting Completo — Todas as Rotas

## Contexto
`lib/rate-limit.ts` existe com `checkRateLimit()`. `/api/pets/lost-active` já tem proteção.
Restam as rotas de write e as públicas de alto volume descobertas.

## O que implementar

### Rotas descobertas (sem rate limit ainda)
- `POST /api/pets` — cadastrar pet (10 req/min por IP)
- `PATCH /api/pets/[id]` — editar pet (20 req/min por IP)
- `DELETE /api/pets/[id]` — deletar pet (10 req/min por IP)
- `POST /api/parceiros` — formulário de parceria (5 req/min por IP)
- `GET /api/pets` — listagem pública (60 req/min por IP)
- `POST /api/webhook/mercadopago` — webhook MP (whitelist de IPs do MP)

### Padrão a seguir (igual pets/lost-active)
```typescript
import { checkRateLimit } from '@/lib/rate-limit'

const result = await checkRateLimit(request, { limit: 10, window: '1m' })
if (!result.success) {
  return NextResponse.json(
    { success: false, error: 'Muitas requisições. Tente em breve.', code: 'RATE_LIMITED' },
    { status: 429, headers: { 'Retry-After': result.retryAfter } }
  )
}
```

## Harness gate
```bash
npm run typecheck && npm run build
grep -rn "checkRateLimit" app/api/ | wc -l  # deve ser >= 7
```

## Critério de aceite
- Todas as 7 rotas listadas têm `checkRateLimit` aplicado
- TypeScript: 0 erros
- Build: sucesso
