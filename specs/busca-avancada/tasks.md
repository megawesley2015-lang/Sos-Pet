# Tasks — Busca Avançada com Filtros Geoespaciais
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md

---

## T1 — Migration SQL: adicionar campo `size` em `pets`

**Fase SDD:** Implementar
**Status:** ✅ Concluído em 2026-06-10
**Arquivo:** `supabase/migrations/20260610_pets_size.sql` (novo)

### O que fazer
1. `ALTER TABLE pets ADD COLUMN IF NOT EXISTS size TEXT CHECK (size IN ('small','medium','large'))`
2. Adicionar índice: `CREATE INDEX IF NOT EXISTS idx_pets_size ON pets(size) WHERE size IS NOT NULL`
3. Atualizar tipo `PetRow` em `lib/types/database.ts` com `size?: 'small' | 'medium' | 'large' | null`
4. Atualizar o Zod schema de criação de pet (`lib/validation/pets.ts`) para incluir `size` como campo opcional

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [x] Migration idempotente (ADD COLUMN IF NOT EXISTS)
- [x] CHECK constraint aceita apenas 'small', 'medium', 'large', null
- [x] `PetRow` em `lib/types/database.ts` tem `size` tipado corretamente
- [x] `npm run typecheck` sem erros

---

## T2 — Atualizar `GET /api/pets` com filtros avançados

**Fase SDD:** Implementar
**Status:** ✅ Concluído em 2026-06-10
**Arquivo:** `app/api/pets/route.ts`

### Especificação EARS
WHEN query params contêm `color`, `size`, `neighborhood`, `lat`, `lng`, `radius_km`
THE SYSTEM SHALL aplicar os filtros na query Supabase.

### O que fazer
1. Adicionar parsing de novos query params com Zod:
   - `color?: string` — aplicar `.ilike('color', `%${color}%`)`
   - `size?: 'small' | 'medium' | 'large'` — `.eq('size', size)`
   - `neighborhood?: string` — `.ilike('neighborhood', `%${neighborhood}%`)`
   - `lat?: number` — latitude do usuário (entre -90 e 90)
   - `lng?: number` — longitude do usuário (entre -180 e 180)
   - `radius_km?: number` — raio em km (entre 1 e 100)
2. Se `lat`, `lng` e `radius_km` presentes:
   - Calcular delta: `delta = radius_km / 111.32`
   - Adicionar `.gte('latitude', lat - delta).lte('latitude', lat + delta).gte('longitude', lng - delta).lte('longitude', lng + delta)`
   - Filtrar apenas pets com coordenadas: `.not('latitude', 'is', null)`
3. Retornar no response o campo `total_count` (query sem LIMIT para contar)
4. Se `radius_km` ativo, ordenar por proximidade: calcular distância em JS após busca (máximo 200 itens) e ordenar antes de paginar

### Harness Commands
```bash
npm run typecheck
npm run build
npx vitest run busca-avancada
```

### Critério de Aceite
- [x] `?color=marrom` retorna pets com cor contendo "marrom"
- [x] `?size=small` retorna apenas pets pequenos
- [x] `?lat=-23.9&lng=-46.3&radius_km=5` retorna apenas pets dentro do raio
- [x] `radius_km` sem `lat` ou `lng` retorna 400 com mensagem clara
- [x] Response inclui `total_count`
- [x] `npm run typecheck` sem erros

---

## T3 — Hook `useSearchFilters` com sincronização de URL

**Fase SDD:** Implementar
**Status:** ✅ Concluído em 2026-06-10
**Arquivo:** `hooks/useSearchFilters.ts` (novo)

### Especificação EARS
WHEN o usuário aplica filtros
THE SYSTEM SHALL atualizar URL query params sem reload.
WHEN URL tem query params ao carregar
THE SYSTEM SHALL restaurar o estado dos filtros.

### O que fazer
1. Estado gerenciado: `{ kind, species, city, color, size, neighborhood, lat, lng, radiusKm }`
2. Inicializar lendo `useSearchParams()` do Next.js
3. Ao mudar qualquer filtro: `router.push` ou `router.replace` com novos query params usando `useRouter()` do Next.js App Router
4. Expor `setFilter(key, value)`, `clearFilters()`, `activeFilterCount: number`
5. `activeFilterCount` conta filtros não-default para badge "X filtros ativos"
6. Geolocation: expor `requestLocation()` que chama `navigator.geolocation.getCurrentPosition`; setar `lat` e `lng` automaticamente; tratar erro de permissão

### Harness Commands
```bash
npm run typecheck
npx vitest run busca-avancada
```

### Critério de Aceite
- [x] `setFilter('color', 'marrom')` atualiza URL para `?color=marrom`
- [x] Recarregar com `?color=marrom` inicializa o hook com `color = 'marrom'`
- [x] `clearFilters()` remove todos os query params
- [x] `activeFilterCount` é 0 quando nenhum filtro aplicado
- [x] `npm run typecheck` sem erros

---

## T4 — Atualizar `FilterBar.tsx` com novos filtros

**Fase SDD:** Implementar
**Status:** ✅ Concluído em 2026-06-10
**Arquivo:** `components/pets/FilterBar.tsx`

### O que fazer
1. Adicionar campos ao `FilterBar`:
   - Input de texto "Cor" (ex: marrom, preto, branco)
   - Select "Porte" com opções Pequeno/Médio/Grande
   - Input de texto "Bairro"
   - Toggle "Buscar por proximidade" com select de raio (1km, 2km, 5km, 10km, 20km)
2. Quando toggle de proximidade é ativado: chamar `requestLocation()` do hook
3. Quando geolocalização negada: exibir alerta inline no FilterBar
4. Badge "X filtros ativos" baseado em `activeFilterCount`
5. Botão "Limpar todos" visível quando `activeFilterCount > 0`
6. Manter compatibilidade com filtros existentes (não quebrar props atuais)

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [x] Toggle de proximidade solicita geolocalização ao ativar
- [x] Badge "X filtros ativos" aparece com filtros aplicados
- [x] "Limpar todos" reseta todos os filtros e URL
- [x] Filtros existentes continuam funcionando
- [x] `npm run typecheck` sem erros

---

## T5 — Exibir contagem de resultados e estado vazio

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/(public)/achados-e-perdidos/page.tsx`

### O que fazer
1. Exibir "X pets encontrados" usando `total_count` do response da API
2. Exibir spinner de loading durante busca
3. Estado vazio: quando `total_count = 0`, exibir card com mensagem e botão "Limpar filtros"
4. Integrar `useSearchFilters` na página para sincronizar URL e FilterBar
5. Ao mudar filtros, resetar cursor de paginação (integração com T2 do módulo paginacao)

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] "X pets encontrados" exibe número correto
- [ ] Spinner aparece durante fetch após mudança de filtro
- [ ] Estado vazio tem botão "Limpar filtros" funcional
- [ ] URL atualiza ao aplicar filtros sem reload completo
- [ ] `npm run build` sem erros

---

## T6 — Testes unitários de filtros

**Fase SDD:** Verificar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `tests/busca-avancada/busca-avancada.test.ts` (novo)

### O que fazer
1. Testar parsing de query params em `GET /api/pets`: todos os filtros válidos, filtros inválidos
2. Testar cálculo de bounding box geoespacial: raio de 5km em Santos
3. Testar `useSearchFilters`: setFilter, clearFilters, activeFilterCount
4. Mock do `navigator.geolocation` para testar fluxo de permissão

### Harness Commands
```bash
npx vitest run busca-avancada
```

### Critério de Aceite
- [ ] Pelo menos 10 casos de teste
- [ ] Teste de bounding box: lat=-23.9, lng=-46.3, radius=5km → delta correto
- [ ] Todos os testes passam

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T5 → T6

**Dependências:**
- T1 pode ser paralelo com T3 (T3 é só lógica JS)
- T2 depende de T1 (campo size disponível)
- T4 depende de T3 (usa o hook)
- T5 depende de T2, T3, T4
- T6 depende de T2 e T3

## Harness Global

```bash
npm run typecheck
npx vitest run busca-avancada
npm run build
```

