# Tasks — Paginação Cursor-Based
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-10
# Referências: spec.md

---

## T1 — Adicionar cursor pagination à API `/api/pets`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-10
**Arquivo:** `app/api/pets/route.ts`

### Especificação EARS
WHEN `GET /api/pets` recebe `cursor_created_at` e `cursor_id`
THE SYSTEM SHALL retornar os próximos 24 pets com `next_cursor` no response.

### O que fazer
1. Adicionar parsing de `cursor_created_at`, `cursor_id` e `limit` (default 24, max 100) via `searchParams`
2. Validar com Zod: `cursor_created_at` é ISO datetime, `cursor_id` é UUID, `limit` é número 1–100
3. Se cursor presente: adicionar filtro `.or('created_at.lt.{ts},and(created_at.eq.{ts},id.lt.{id})')` na query Supabase
4. Ordenar por `created_at DESC, id DESC`
5. Buscar `limit + 1` registros: se voltou `limit + 1`, há próxima página — remover o último item do array e montar `next_cursor`
6. Retornar `{ success: true, data: { pets, next_cursor } }`
7. Se `limit > 100`: retornar `fail(new Error('Limite máximo é 100'))` com status 400

### Harness Commands
```bash
npm run typecheck
npx vitest run paginacao
```

### Critério de Aceite
- [ ] `GET /api/pets` sem cursor retorna 24 pets e `next_cursor` não-nulo
- [ ] `GET /api/pets?cursor_created_at=X&cursor_id=Y` retorna próximos 24 sem duplicatas
- [ ] Última página retorna `next_cursor: null`
- [ ] `GET /api/pets?limit=200` retorna 400
- [ ] `npm run typecheck` sem erros

---

## T2 — Hook `usePaginatedPets` para `/achados-e-perdidos`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-10
**Arquivo:** `hooks/usePaginatedPets.ts` (novo)

### Especificação EARS
WHEN o hook é inicializado
THE SYSTEM SHALL buscar a primeira página de pets.
WHEN `loadMore()` é chamado
THE SYSTEM SHALL buscar a próxima página e acumular resultados.

### O que fazer
1. Criar hook client-side com estado: `pets: PetPublic[]`, `nextCursor`, `isLoading`, `hasMore`, `error`
2. Aceitar parâmetros de filtro: `{ kind?, species?, city?, status? }` — quando filtro muda, resetar cursor e pets
3. `loadMore()`: se `isLoading` ou `!hasMore`, retornar cedo
4. Fetch para `/api/pets` com params serializados; acumular resultado com `setPets(prev => [...prev, ...newPets])`
5. Tratar erro de rede: setar `error`, não limpar `pets` já carregados
6. Retornar `{ pets, loadMore, isLoading, hasMore, error, reset }`

### Harness Commands
```bash
npm run typecheck
npx vitest run paginacao
```

### Critério de Aceite
- [ ] Primeira chamada carrega 24 pets
- [ ] Segunda chamada acumula (não substitui) com próximos 24
- [ ] Mudar filtro de espécie zera a lista e recarrega
- [ ] `hasMore = false` quando `next_cursor` é null
- [ ] `npm run typecheck` sem erros

---

## T3 — Atualizar `PetGrid.tsx` com botão "Carregar mais"

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-10
**Arquivo:** `components/pets/PetGrid.tsx`

### Especificação EARS
WHEN não existirem mais pets a exibir
THE SYSTEM SHALL ocultar botão "Carregar mais" e exibir "Todos os pets carregados".

### O que fazer
1. Adicionar props: `onLoadMore?: () => void`, `isLoadingMore?: boolean`, `hasMore?: boolean`
2. Renderizar botão "Carregar mais" abaixo da grid quando `hasMore === true`
3. Botão em estado de loading (spinner + desabilitado) quando `isLoadingMore === true`
4. Exibir `<p>Todos os pets carregados</p>` quando `hasMore === false` e `pets.length > 0`
5. Usar classes Tailwind v4 — botão com `bg-primary` e hover consistente com design system

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] Botão "Carregar mais" aparece quando `hasMore = true`
- [ ] Botão desabilitado durante loading
- [ ] Mensagem "Todos os pets carregados" aparece quando `hasMore = false`
- [ ] Props novas não quebram usos existentes de `PetGrid` (props opcionais)
- [ ] `npm run typecheck` sem erros

---

## T4 — Integrar paginação na página `/achados-e-perdidos`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-10
**Arquivo:** `app/(public)/achados-e-perdidos/page.tsx`

### Especificação EARS
WHEN o usuário altera qualquer filtro em `FilterBar`
THE SYSTEM SHALL resetar o cursor para null e recarregar desde a primeira página.

### O que fazer
1. Converter página para Client Component (`'use client'`) — ou mover lógica para componente filho
2. Usar `usePaginatedPets` passando filtros ativos de `FilterBar`
3. Conectar `onLoadMore={loadMore}`, `isLoadingMore={isLoading}`, `hasMore={hasMore}` em `PetGrid`
4. Garantir que mudança em qualquer filtro chama `reset()` do hook antes de atualizar filtros

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Página inicial mostra 24 pets
- [ ] "Carregar mais" funciona e acumula pets
- [ ] Filtrar por espécie reseta lista e mostra primeiros 24 da espécie
- [ ] Sem duplicatas visíveis na listagem
- [ ] `npm run build` sem erros

---

## T5 — Paginação em `/prestadores` e `/ong/pets`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-10
**Arquivos:** `app/(public)/prestadores/page.tsx`, `app/ong/pets/page.tsx`

### Especificação EARS
WHEN o usuário acessa `/prestadores`
THE SYSTEM SHALL exibir no máximo 20 prestadores por página, ordenados por `avaliacao DESC, created_at DESC`.

### O que fazer
1. Criar hook `usePaginatedPrestadores` similar ao `usePaginatedPets` mas para tabela `prestadores`
2. Cursor composto: `(avaliacao, created_at, id)` — ordenar `avaliacao DESC, created_at DESC, id DESC`
3. Adicionar botão "Carregar mais" em `/prestadores`
4. Para `/ong/pets`: reutilizar padrão do hook; manter filtros de status ao paginar
5. Limite: 20 por página em ambas as rotas

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `/prestadores` exibe 20 por página com botão "Carregar mais"
- [ ] Ordenação de prestadores: maior avaliação primeiro
- [ ] `/ong/pets` pagina por 20 mantendo filtro de status
- [ ] `npm run typecheck` sem erros

---

## T6 — Testes unitários de paginação

**Fase SDD:** Verificar
**Status:** ✅ Concluído — 2026-06-10
**Arquivo:** `tests/paginacao/paginacao.test.ts` (novo)

### O que fazer
1. Testar parsing de cursor na API route: cursor válido, cursor inválido, sem cursor
2. Testar lógica de `next_cursor`: quando array tem `limit+1` itens, quando tem menos
3. Testar hook `usePaginatedPets`: reset ao mudar filtro, acumulação de resultados
4. Mock do fetch com `vi.fn()`

### Harness Commands
```bash
npx vitest run paginacao
```

### Critério de Aceite
- [ ] Pelo menos 8 casos de teste cobrindo happy path e edge cases
- [ ] Todos os testes passam com `npx vitest run paginacao`

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T5 → T6

**Dependências:**
- T2 depende de T1 (API route com cursor pronta)
- T3 é independente de T1/T2 (apenas mudança de componente)
- T4 depende de T2 e T3
- T5 é paralelo a T4 (mesma estrutura, tabelas diferentes)
- T6 depende de T1 e T2 (testa a lógica implementada)

## Harness Global

```bash
npm run typecheck
npx vitest run paginacao
npm run build
```
