'use client'

import { useState, useTransition } from 'react'
import { useSearchFilters } from '@/hooks/useSearchFilters'

const KIND_OPTIONS = [
  { value: '',      label: 'Todos' },
  { value: 'lost',  label: '🐾 Perdidos' },
  { value: 'found', label: '🔍 Encontrados' },
]
const SPECIES_OPTIONS = [
  { value: '',      label: 'Todas' },
  { value: 'dog',   label: 'Cachorro' },
  { value: 'cat',   label: 'Gato' },
  { value: 'other', label: 'Outro' },
]
const SIZE_OPTIONS = [
  { value: '',       label: 'Qualquer porte' },
  { value: 'small',  label: 'Pequeno' },
  { value: 'medium', label: 'Médio' },
  { value: 'large',  label: 'Grande' },
]
const RADIUS_OPTIONS = [
  { value: 1,  label: '1 km' },
  { value: 2,  label: '2 km' },
  { value: 5,  label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
]

const selectCls = `
  rounded-lg border border-border
  bg-bg-raised
  text-fg-muted
  px-3 py-2 text-sm cursor-pointer
  hover:border-border-strong
  focus:border-brand-500/60
  focus:outline-none focus:ring-2 focus:ring-brand-500/20
  transition-all duration-200
`.trim()

const inputCls = `${selectCls} min-w-[120px]`

export function FilterBar() {
  const { filters, setFilter, clearFilters, activeFilterCount, requestLocation } = useSearchFilters()
  const [geoError, setGeoError]   = useState<string | null>(null)
  const [, startTransition]       = useTransition()

  const proximityActive = filters.lat !== undefined && filters.lng !== undefined

  function handleSetFilter(key: Parameters<typeof setFilter>[0], value: string | number | undefined) {
    startTransition(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFilter(key, value as any)
    })
  }

  function handleClear() {
    setGeoError(null)
    startTransition(() => clearFilters())
  }

  function toggleProximity() {
    if (proximityActive) {
      startTransition(() => {
        setFilter('lat',      undefined)
        setFilter('lng',      undefined)
        setFilter('radiusKm', undefined)
      })
      setGeoError(null)
    } else {
      requestLocation((msg) => setGeoError(msg))
    }
  }

  return (
    <div className="space-y-3" aria-label="Filtros de pesquisa">
      <div className="flex flex-wrap items-center gap-3 py-2">

        {/* ── Filtros existentes ─────────────────────────────────────────── */}
        <select
          value={filters.kind ?? ''}
          onChange={(e) => handleSetFilter('kind', e.target.value || undefined)}
          aria-label="Filtrar por tipo"
          className={selectCls}
        >
          {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={filters.species ?? ''}
          onChange={(e) => handleSetFilter('species', e.target.value || undefined)}
          aria-label="Filtrar por espécie"
          className={selectCls}
        >
          {SPECIES_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <input
          key={`city-${activeFilterCount === 0 ? 'clear' : 'set'}`}
          type="text"
          defaultValue={filters.city ?? ''}
          placeholder="Cidade..."
          aria-label="Filtrar por cidade"
          onBlur={(e)    => handleSetFilter('city', e.target.value.trim() || undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSetFilter('city', (e.target as HTMLInputElement).value.trim() || undefined)
          }}
          className={inputCls}
        />

        {/* ── Novos filtros ──────────────────────────────────────────────── */}
        <input
          key={`color-${activeFilterCount === 0 ? 'clear' : 'set'}`}
          type="text"
          defaultValue={filters.color ?? ''}
          placeholder="Cor (ex: marrom)..."
          aria-label="Filtrar por cor"
          onBlur={(e)    => handleSetFilter('color', e.target.value.trim() || undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSetFilter('color', (e.target as HTMLInputElement).value.trim() || undefined)
          }}
          className={inputCls}
        />

        <select
          value={filters.size ?? ''}
          onChange={(e) => handleSetFilter('size', e.target.value || undefined)}
          aria-label="Filtrar por porte"
          className={selectCls}
        >
          {SIZE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <input
          key={`neighborhood-${activeFilterCount === 0 ? 'clear' : 'set'}`}
          type="text"
          defaultValue={filters.neighborhood ?? ''}
          placeholder="Bairro..."
          aria-label="Filtrar por bairro"
          onBlur={(e)    => handleSetFilter('neighborhood', e.target.value.trim() || undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSetFilter('neighborhood', (e.target as HTMLInputElement).value.trim() || undefined)
          }}
          className={inputCls}
        />

        {/* ── Proximidade ────────────────────────────────────────────────── */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-fg-muted">
          <input
            type="checkbox"
            checked={proximityActive}
            onChange={toggleProximity}
            className="w-4 h-4 accent-brand-500"
          />
          Buscar por proximidade
        </label>

        {proximityActive && (
          <select
            value={filters.radiusKm ?? 5}
            onChange={(e) => handleSetFilter('radiusKm', Number(e.target.value))}
            aria-label="Raio de busca"
            className={selectCls}
          >
            {RADIUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {/* ── Badge + Limpar ─────────────────────────────────────────────── */}
        {activeFilterCount > 0 && (
          <>
            <span className="text-xs font-medium text-brand-500 bg-brand-500/10 px-2 py-1 rounded-full">
              {activeFilterCount} {activeFilterCount === 1 ? 'filtro ativo' : 'filtros ativos'}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-fg-subtle hover:text-brand-500 transition-colors"
            >
              Limpar todos
            </button>
          </>
        )}
      </div>

      {/* ── Erro de geolocalização ─────────────────────────────────────────── */}
      {geoError && (
        <p role="alert" className="text-xs text-red-400">
          {geoError}
        </p>
      )}
    </div>
  )
}
