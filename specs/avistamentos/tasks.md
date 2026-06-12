# Tasks — Avistamentos (Sightings)
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md

---

## T1 — Migration SQL: tabela `sightings`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `supabase/migrations/20260610_sightings.sql` (novo)

### O que fazer
1. Criar `sightings`:
   - `id UUID PK DEFAULT gen_random_uuid()`
   - `pet_id UUID → pets(id) ON DELETE CASCADE NOT NULL`
   - `reporter_id UUID → auth.users(id) ON DELETE SET NULL`
   - `sighted_at TIMESTAMPTZ NOT NULL`
   - `latitude FLOAT8`
   - `longitude FLOAT8`
   - `neighborhood TEXT`
   - `city TEXT NOT NULL`
   - `description TEXT`
   - `photo_url TEXT`
   - `status TEXT CHECK IN ('active','hidden') DEFAULT 'active'`
   - `report_count INTEGER DEFAULT 0`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
2. ENABLE ROW LEVEL SECURITY
3. Políticas RLS:
   - SELECT: `status = 'active'` — público
   - INSERT: autenticado (auth.uid() IS NOT NULL); com `reporter_id = auth.uid()`
   - UPDATE: somente o próprio reporter ou tutor do pet (`auth.uid() = reporter_id`)
   - DELETE: somente reporter ou admin (via service_role)
4. Índices: `(pet_id, sighted_at DESC)`, `(city, sighted_at DESC)`, `(latitude, longitude)` WHERE lat IS NOT NULL, `(status, created_at DESC)`

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] Migration idempotente
- [ ] SELECT público retorna apenas `status = 'active'`
- [ ] INSERT sem autenticação bloqueado por RLS
- [ ] Índice geoespacial criado para queries de mapa

---

## T2 — API Routes de avistamentos

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:**
- `app/api/sightings/route.ts` (novo)
- `app/api/sightings/[id]/route.ts` (novo)
- `app/api/sightings/[id]/report/route.ts` (novo)

### Especificação EARS
WHEN `POST /api/sightings` com campos válidos
THE SYSTEM SHALL inserir e retornar o avistamento criado.

### O que fazer
**`app/api/sightings/route.ts`:**
1. `GET`: aceitar query params `pet_id`, `city`, `cursor_sighted_at`, `cursor_id`, `limit` (default 20);
   cursor-based pagination; select explícito sem `reporter_id` na resposta pública
2. `POST`: verificar autenticação; validar com Zod (`sighted_at` não-futuro, `city` obrigatório se sem lat/long);
   rate limit `sightings:{userId}` — max 5/hora;
   inserir; disparar notificação ao tutor (fetch interno para `/api/notifications/sighting`)

**`app/api/sightings/[id]/route.ts`:**
1. `PATCH`: só reporter pode editar; campos editáveis: description, photo_url
2. `DELETE`: só reporter pode deletar

**`app/api/sightings/[id]/report/route.ts`:**
1. `POST`: incrementar `report_count`; se `report_count >= 3`, setar `status = 'hidden'`;
   inserir em `sighting_reports` (tabela simples: `sighting_id`, `reporter_id`, UNIQUE)

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `GET /api/sightings` nunca retorna `reporter_id`, telefone ou dados pessoais
- [ ] `POST` com `sighted_at` futuro retorna 422
- [ ] `POST` sem lat/long e sem city retorna 422
- [ ] `POST` do 6º avistamento na hora retorna 429
- [ ] `POST /api/sightings/[id]/report` 3x de reporters diferentes seta `status = 'hidden'`
- [ ] `npm run typecheck` sem erros

---

## T3 — Schema Zod e tipos para avistamentos

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:**
- `lib/validation/sightings.ts` (novo)
- `lib/types/database.ts` (adicionar `SightingRow`, `SightingPublic`)

### O que fazer
1. Schema `sightingSchema`:
   - `pet_id`: UUID válido
   - `sighted_at`: datetime, não pode ser futuro (refine com `z.date().max(new Date())`)
   - `latitude`: opcional, número entre -90 e 90
   - `longitude`: opcional, número entre -180 e 180
   - `city`: obrigatório se `latitude` ausente (`.superRefine`)
   - `neighborhood`: string opcional
   - `description`: string opcional, max 500 chars
   - `photo_url`: URL opcional
2. Tipo `SightingRow`: todos os campos da tabela
3. Tipo `SightingPublic`: omitindo `reporter_id` — para uso em listagens públicas
4. Adicionar tipos em `lib/types/database.ts`

### Harness Commands
```bash
npm run typecheck
npx vitest run avistamentos
```

### Critério de Aceite
- [ ] `sightingSchema.parse({ sighted_at: new Date(Date.now() + 86400000) })` lança ZodError
- [ ] `sightingSchema.parse({ city: undefined, latitude: undefined })` lança ZodError
- [ ] `SightingPublic` não tem campo `reporter_id`
- [ ] `npm run typecheck` sem erros

---

## T4 — Formulário `/avistamentos/novo`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/(public)/avistamentos/novo/page.tsx`

### O que fazer
1. Client Component com formulário controlado
2. Seleção de pet: buscar pets `kind = 'lost', status = 'active'` via `/api/pets?kind=lost&status=active&limit=50`; renderizar como dropdown com busca
3. Campo de data/hora: datetime-local, com validação max = now()
4. Botão "Usar minha localização": chamar `navigator.geolocation.getCurrentPosition`; preencher `latitude`, `longitude`; mostrar mapa preview do ponto
5. Se geolocalização negada: mostrar campos de city/neighborhood obrigatórios
6. Preview de foto: upload para Supabase Storage bucket `sighting-images` antes de submit
7. Submit: `POST /api/sightings`; redirecionar para `/avistamentos` com toast de sucesso
8. Requerer autenticação: redirecionar para `/login?next=/avistamentos/novo` se não logado

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Sem autenticação, redireciona para `/login`
- [ ] Botão "Usar minha localização" preenche campos de coordenadas
- [ ] Dropdown de pets mostra apenas pets `kind = 'lost'` e `status = 'active'`
- [ ] Data futura exibe erro de validação client-side antes do submit
- [ ] `npm run typecheck` sem erros

---

## T5 — Feed `/avistamentos` com paginação

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/(public)/avistamentos/page.tsx`

### O que fazer
1. Server Component inicial com os 20 avistamentos mais recentes
2. Filtro de cidade via query param `?city=santos`
3. Card de avistamento: foto do pet perdido (de `pets.photo_url`), data/hora, cidade, bairro, descrição truncada a 100 chars, miniatura do avistamento (se houver)
4. Botão "Carregar mais" (pattern idêntico ao hook `usePaginatedPets`)
5. Link "Reportar" em cada card chamando `POST /api/sightings/[id]/report`
6. Badge "Avistado há X horas" calculado de `sighted_at`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Feed exibe 20 avistamentos no carregamento inicial
- [ ] Filtro por cidade funciona via query param
- [ ] "Carregar mais" acumula sem duplicatas
- [ ] Nenhum dado pessoal do reporter visível
- [ ] `npm run typecheck` sem erros

---

## T6 — Avistamentos no mapa `/mapa` e em `/pets/[id]`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:** `app/(public)/mapa/page.tsx`, `app/(public)/pets/[id]/page.tsx`

### O que fazer
**Mapa:**
1. Buscar avistamentos com coordenadas dos últimos 30 dias via `/api/sightings?has_coords=true&days=30`
2. Adicionar ao mapa Leaflet: pin diferenciado para avistamentos (cor diferente dos pets perdidos)
3. Popup com data, bairro, descrição truncada, link para o pet correspondente

**`/pets/[id]`:**
1. Query separada: buscar até 5 avistamentos mais recentes para `pet_id` via `sightings`
2. Renderizar seção colapsável "Avistamentos recentes" com cards compactos
3. Link "Ver todos" → `/avistamentos?pet_id=[id]`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Mapa exibe pins de avistamentos distintos dos pins de pets
- [ ] Popup de avistamento tem link para o pet
- [ ] `/pets/[id]` exibe no máximo 5 avistamentos
- [ ] `npm run typecheck` sem erros

---

## Ordem de Execução

T1 → T3 → T2 → T4 → T5 → T6

**Dependências:**
- T3 pode ser feito em paralelo com T1
- T2 depende de T1 e T3
- T4, T5, T6 dependem de T2

## Harness Global

```bash
npm run typecheck
npx vitest run avistamentos
npm run build
```

