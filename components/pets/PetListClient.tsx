'use client'

// components/pets/PetListClient.tsx
// Client Component para paginação cursor-based em /achados-e-perdidos.
// Lê filtros via useSearchFilters (URL como fonte da verdade).

import { useSearchFilters }  from '@/hooks/useSearchFilters'
import { usePaginatedPets }  from '@/hooks/usePaginatedPets'
import { PetGrid }           from '@/components/pets/PetGrid'

export function PetListClient() {
  const { filters, clearFilters, activeFilterCount } = useSearchFilters()
  const { pets, loadMore, isLoading, hasMore, error, total_count } = usePaginatedPets({
    kind:         filters.kind,
    species:      filters.species,
    city:         filters.city,
    color:        filters.color,
    size:         filters.size,
    neighborhood: filters.neighborhood,
    lat:          filters.lat,
    lng:          filters.lng,
    radiusKm:     filters.radiusKm,
  })

  // Estado de loading inicial (lista vazia ainda sendo carregada)
  if (isLoading && pets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-fg-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="text-sm">Buscando pets...</p>
      </div>
    )
  }

  // Estado vazio
  if (!isLoading && total_count === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-4xl">🐾</p>
        <p className="text-lg font-semibold text-fg">Nenhum pet encontrado</p>
        <p className="text-sm text-fg-muted">
          {activeFilterCount > 0
            ? 'Tente remover alguns filtros para ver mais resultados.'
            : 'Ainda não há registros. Seja o primeiro a cadastrar!'}
        </p>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => clearFilters()}
            className="
              mt-2 rounded-full bg-brand-500 px-6 py-2.5
              text-sm font-semibold text-white
              hover:bg-brand-500/90 transition-colors
            "
          >
            Limpar filtros
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <p className="text-xs text-fg-subtle">
          {total_count} pet{total_count !== 1 ? 's' : ''} encontrado{total_count !== 1 ? 's' : ''}
        </p>
        {isLoading && (
          <div className="h-3 w-3 animate-spin rounded-full border border-brand-500 border-t-transparent" />
        )}
      </div>

      <PetGrid
        pets={pets}
        onLoadMore={loadMore}
        isLoadingMore={isLoading}
        hasMore={hasMore}
      />

      {error && (
        <p className="text-center text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
