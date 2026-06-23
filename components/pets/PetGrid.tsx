// components/pets/PetGrid.tsx — grade responsiva de cards de pets

import { PetCard } from '@/components/pets/PetCard'
import { PetEmptyState } from '@/components/pets/PetEmptyState'
import type { PetPublic } from '@/types/pets'

interface PetGridProps {
  pets:            PetPublic[]
  emptyMessage?:   string
  onLoadMore?:     () => void
  isLoadingMore?:  boolean
  hasMore?:        boolean
}

export function PetGrid({
  pets,
  emptyMessage  = 'Nenhum pet encontrado com esses filtros.',
  onLoadMore,
  isLoadingMore = false,
  hasMore,
}: PetGridProps) {
  if (pets.length === 0) {
    return <PetEmptyState message={emptyMessage} />
  }

  return (
    <div className="flex flex-col gap-6">
      <ul
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
        aria-label="Alertas de pets"
      >
        {pets.map((pet, index) => (
          <li
            key={pet.id}
            className={index < 8 ? 'animate-fade-in' : undefined}
            style={index < 8 ? { animationDelay: `${index * 50}ms` } : undefined}
          >
            <PetCard pet={pet} />
          </li>
        ))}
      </ul>

      {/* Paginação — só renderiza quando há controle de paginação */}
      {hasMore !== undefined && (
        <div className="flex justify-center pt-2">
          {hasMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="
                inline-flex items-center gap-2 rounded-full
                border border-[rgb(var(--color-primary))]/40
                bg-[rgb(var(--color-primary))]/10
                text-[rgb(var(--color-primary))]
                px-8 py-3 text-sm font-semibold
                transition-all duration-200
                hover:bg-[rgb(var(--color-primary))]/20
                disabled:cursor-not-allowed disabled:opacity-50
                focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-[rgb(var(--color-primary))]
              "
              aria-busy={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />
                  Carregando...
                </>
              ) : (
                'Carregar mais'
              )}
            </button>
          ) : (
            <p className="text-xs text-[rgb(var(--color-fg-subtle))]">
              Todos os pets carregados
            </p>
          )}
        </div>
      )}
    </div>
  )
}
