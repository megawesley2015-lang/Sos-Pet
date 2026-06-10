'use client'
// components/pets/FilterBar.tsx — filtros client-side que atualizam URL sem reload

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

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

export function FilterBar() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const currentKind    = searchParams.get('kind')    ?? ''
  const currentSpecies = searchParams.get('species') ?? ''
  const currentCity    = searchParams.get('city')    ?? ''

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else        params.delete(key)
    params.delete('page')
    startTransition(() => { router.push(`${pathname}?${params.toString()}`) })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 py-4" aria-label="Filtros de pesquisa">
      <select
        value={currentKind}
        onChange={(e) => updateFilter('kind', e.target.value)}
        aria-label="Filtrar por tipo"
        className={selectCls}
      >
        {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select
        value={currentSpecies}
        onChange={(e) => updateFilter('species', e.target.value)}
        aria-label="Filtrar por espécie"
        className={selectCls}
      >
        {SPECIES_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <input
        type="text"
        defaultValue={currentCity}
        placeholder="Cidade..."
        aria-label="Filtrar por cidade"
        onBlur={(e) => updateFilter('city', e.target.value.trim())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') updateFilter('city', (e.target as HTMLInputElement).value.trim())
        }}
        className={`${selectCls} min-w-[140px]`}
      />

      {pending && (
        <span className="text-xs text-fg-subtle animate-pulse">Filtrando...</span>
      )}

      {(currentKind || currentSpecies || currentCity) && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="text-xs text-fg-subtle hover:text-brand-500 transition-colors"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
