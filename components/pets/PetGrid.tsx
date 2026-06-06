// components/pets/PetGrid.tsx — grade responsiva de cards de pets

import { PetCard } from '@/components/pets/PetCard'
import type { PetPublic } from '@/types/pets'

interface PetGridProps {
  pets:          PetPublic[]
  emptyMessage?: string
}

export function PetGrid({
  pets,
  emptyMessage = 'Nenhum pet encontrado com esses filtros.',
}: PetGridProps) {
  if (pets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="text-5xl" aria-hidden="true">🐾</span>
        <p className="text-sm text-[rgb(var(--color-fg-muted))]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="list"
      aria-label="Alertas de pets"
    >
      {pets.map((pet) => (
        <li key={pet.id}><PetCard pet={pet} /></li>
      ))}
    </ul>
  )
}
