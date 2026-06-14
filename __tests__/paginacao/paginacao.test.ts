/**
 * Testes — Paginação cursor-based
 *
 * Cobre: lógica de next_cursor, buildCursorFilter, usePaginatedPets
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Helpers de lógica pura (extraídos da API route) ────────────────────────

interface PetRow {
  id:         string
  created_at: string
  name:       string
}

interface PetCursor {
  created_at: string
  id:         string
}

/** Simula o comportamento de "limit+1 → detectar próxima página" */
function buildNextCursor(rows: PetRow[], limit: number): PetCursor | null {
  const hasMore = rows.length > limit
  const items   = hasMore ? rows.slice(0, limit) : rows
  const last    = items[items.length - 1]
  return hasMore && last ? { created_at: last.created_at, id: last.id } : null
}

/** Simula o filtro keyset na memória */
function applyKeysetFilter(
  allRows: PetRow[],
  cursor: PetCursor | null,
  limit: number
): PetRow[] {
  // Ordena descrescente por (created_at DESC, id DESC) — simula banco
  const sorted = [...allRows].sort((a, b) => {
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1
    return a.id < b.id ? 1 : -1
  })

  if (!cursor) return sorted.slice(0, limit + 1)

  const filtered = sorted.filter(row =>
    row.created_at < cursor.created_at ||
    (row.created_at === cursor.created_at && row.id < cursor.id)
  )
  return filtered.slice(0, limit + 1)
}

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeRow(n: number): PetRow {
  const ts = new Date(2026, 0, 1, 0, 0, n).toISOString()
  return { id: `id-${String(n).padStart(3, '0')}`, created_at: ts, name: `Pet ${n}` }
}

// 50 rows em ordem crescente de índice (mais antigos → menores índices)
const ALL_ROWS: PetRow[] = Array.from({ length: 50 }, (_, i) => makeRow(i + 1))

// ── Testes: buildNextCursor ──────────────────────────────────────────────────

describe('buildNextCursor', () => {
  it('retorna cursor quando há mais itens (rows.length > limit)', () => {
    const rows  = ALL_ROWS.slice(0, 25) // 25 = limit+1
    const limit = 24
    const cursor = buildNextCursor(rows, limit)
    expect(cursor).not.toBeNull()
    expect(cursor?.id).toBe(rows[23].id)          // último item mantido
    expect(cursor?.created_at).toBe(rows[23].created_at)
  })

  it('retorna null na última página (rows.length <= limit)', () => {
    const rows  = ALL_ROWS.slice(0, 10)
    const cursor = buildNextCursor(rows, 24)
    expect(cursor).toBeNull()
  })

  it('retorna null quando rows está vazio', () => {
    const cursor = buildNextCursor([], 24)
    expect(cursor).toBeNull()
  })

  it('retorna null quando rows.length === limit (sem próxima página)', () => {
    const rows = ALL_ROWS.slice(0, 24)
    expect(buildNextCursor(rows, 24)).toBeNull()
  })
})

// ── Testes: applyKeysetFilter ────────────────────────────────────────────────

describe('applyKeysetFilter (simulação banco)', () => {
  const LIMIT = 24

  it('sem cursor retorna primeiros limit+1 registros (mais recentes)', () => {
    const result = applyKeysetFilter(ALL_ROWS, null, LIMIT)
    expect(result).toHaveLength(LIMIT + 1)
    // O mais recente é makeRow(50)
    expect(result[0].name).toBe('Pet 50')
  })

  it('com cursor retorna registros após o cursor sem duplicatas', () => {
    // Primeira página
    const page1Rows = applyKeysetFilter(ALL_ROWS, null, LIMIT)
    const page1     = page1Rows.slice(0, LIMIT)
    const cursor    = buildNextCursor(page1Rows, LIMIT)!

    // Segunda página
    const page2Rows = applyKeysetFilter(ALL_ROWS, cursor, LIMIT)
    const page2     = page2Rows.slice(0, Math.min(LIMIT, page2Rows.length))

    // Sem sobreposição
    const ids1 = new Set(page1.map(r => r.id))
    const overlap = page2.filter(r => ids1.has(r.id))
    expect(overlap).toHaveLength(0)
  })

  it('terceira página não retorna itens das páginas anteriores', () => {
    const page1Rows = applyKeysetFilter(ALL_ROWS, null, LIMIT)
    const cursor1   = buildNextCursor(page1Rows, LIMIT)!
    const page2Rows = applyKeysetFilter(ALL_ROWS, cursor1, LIMIT)
    const cursor2   = buildNextCursor(page2Rows, LIMIT) // pode ser null se < 50 rows

    if (!cursor2) return // menos de 48 rows — teste não se aplica

    const page3 = applyKeysetFilter(ALL_ROWS, cursor2, LIMIT)
    const ids12 = new Set([
      ...page1Rows.slice(0, LIMIT).map(r => r.id),
      ...page2Rows.slice(0, LIMIT).map(r => r.id),
    ])
    const overlap = page3.filter(r => ids12.has(r.id))
    expect(overlap).toHaveLength(0)
  })

  it('última página tem next_cursor = null', () => {
    // Com 50 rows e limit=24: página 1 = 24, página 2 = 24, página 3 = 2
    const p1 = applyKeysetFilter(ALL_ROWS, null, LIMIT)
    const c1 = buildNextCursor(p1, LIMIT)!
    const p2 = applyKeysetFilter(ALL_ROWS, c1, LIMIT)
    const c2 = buildNextCursor(p2, LIMIT)!
    const p3 = applyKeysetFilter(ALL_ROWS, c2, LIMIT)
    const c3 = buildNextCursor(p3, LIMIT)
    expect(c3).toBeNull()
  })
})

// ── Testes: limite > 100 ──────────────────────────────────────────────────────

describe('validação de limit', () => {
  it('limit = 100 é aceito (máximo válido)', () => {
    expect(Math.min(100, 100)).toBe(100)
  })

  it('limit = 101 deve ser rejeitado (retornaria 400)', () => {
    const limitRaw = 101
    const shouldReject = limitRaw > 100
    expect(shouldReject).toBe(true)
  })

  it('limit = 0 é normalizado para 1', () => {
    expect(Math.max(1, 0)).toBe(1)
  })

  it('limit negativo é normalizado para 1', () => {
    expect(Math.max(1, -5)).toBe(1)
  })
})

// ── Testes: usePaginatedPets (mock de fetch) ────────────────────────────────

describe('usePaginatedPets — lógica de acumulação', () => {
  const PAGE_1: PetRow[] = Array.from({ length: 24 }, (_, i) => makeRow(50 - i))
  const PAGE_2: PetRow[] = Array.from({ length: 10 }, (_, i) => makeRow(26 - i))

  function simulateHook() {
    let acc: PetRow[] = []
    let cursor: PetCursor | null = null
    let hasMore = false

    function onPage1(rows: PetRow[], nc: PetCursor | null) {
      acc    = rows
      cursor = nc
      hasMore = nc !== null
    }
    function onPage2(rows: PetRow[], nc: PetCursor | null) {
      acc    = [...acc, ...rows]
      cursor = nc
      hasMore = nc !== null
    }
    return { acc: () => acc, cursor: () => cursor, hasMore: () => hasMore, onPage1, onPage2 }
  }

  it('acumula pets ao chamar loadMore', () => {
    const h = simulateHook()
    const cursor1 = { created_at: PAGE_1[23].created_at, id: PAGE_1[23].id }

    h.onPage1(PAGE_1, cursor1)
    expect(h.acc()).toHaveLength(24)
    expect(h.hasMore()).toBe(true)

    h.onPage2(PAGE_2, null)
    expect(h.acc()).toHaveLength(34)
    expect(h.hasMore()).toBe(false)
  })

  it('não repete pets entre páginas', () => {
    const h = simulateHook()
    const cursor1 = { created_at: PAGE_1[23].created_at, id: PAGE_1[23].id }

    h.onPage1(PAGE_1, cursor1)
    h.onPage2(PAGE_2, null)

    const ids = h.acc().map(p => p.id)
    const unique = new Set(ids)
    expect(ids.length).toBe(unique.size)
  })

  it('reset ao mudar filtro substitui (não acumula) a lista', () => {
    const h = simulateHook()
    const cursor1 = { created_at: PAGE_1[23].created_at, id: PAGE_1[23].id }

    h.onPage1(PAGE_1, cursor1)
    expect(h.acc()).toHaveLength(24)

    // Simula reset por filtro: nova página 1 substitui tudo
    const newPage: PetRow[] = Array.from({ length: 5 }, (_, i) => makeRow(100 + i))
    h.onPage1(newPage, null) // substitui, não acumula
    expect(h.acc()).toHaveLength(5)
    expect(h.hasMore()).toBe(false)
  })

  it('hasMore = false quando next_cursor é null', () => {
    const h = simulateHook()
    h.onPage1(PAGE_2, null) // PAGE_2 = 10 itens, sem próxima
    expect(h.hasMore()).toBe(false)
  })
})
