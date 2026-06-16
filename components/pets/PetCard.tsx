// components/pets/PetCard.tsx — card individual de pet, listagem pública

import Link  from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, ChevronRight } from 'lucide-react'
import type { PetPublic, PetKind } from '@/types/pets'
import { SOSBadge } from '@/components/ui/SOSBadge'

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffH  = Math.floor(diffMs / 3_600_000)
  const diffD  = Math.floor(diffH / 24)

  if (diffH < 1)   return 'Agora mesmo'
  if (diffH < 24)  return `${diffH}h atrás`
  if (diffD === 1) return 'Ontem'
  if (diffD < 7)   return `${diffD} dias atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const SPECIES_LABEL: Record<string, string> = { dog: 'Cachorro', cat: 'Gato', other: 'Animal' }
const SIZE_LABEL:    Record<string, string> = { small: 'Pequeno', medium: 'Médio', large: 'Grande' }


interface PetCardProps {
  pet: PetPublic
}

export function PetCard({ pet }: PetCardProps) {
  const speciesLabel = SPECIES_LABEL[pet.species ?? ''] ?? 'Animal'
  const sizeLabel    = SIZE_LABEL[pet.size ?? ''] ?? ''
  const displayName  = pet.name ? `${pet.name} · ${speciesLabel}` : speciesLabel

  return (
    <Link
      href={`/achados-e-perdidos/${pet.id}`}
      className="
        group relative flex flex-col rounded-xl overflow-hidden
        border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-raised))]
        hover:border-[rgb(var(--color-border-strong))] hover:shadow-lg hover:shadow-black/20
        transition-all duration-200
      "
      aria-label={`${pet.kind === 'lost' ? 'Pet perdido' : 'Pet encontrado'}: ${pet.name ?? speciesLabel} em ${pet.city}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[rgb(var(--color-bg-overlay))]">
        {pet.photo_url ? (
          <Image
            src={pet.photo_url}
            alt={pet.name ? `Foto de ${pet.name}` : `Foto de ${speciesLabel}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden="true">
            {pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : '🐾'}
          </div>
        )}
        <div className="absolute left-3 top-3"><SOSBadge kind={pet.kind as PetKind} /></div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div>
          <p className="text-sm font-bold text-[rgb(var(--color-fg))] leading-tight">
            {displayName}{pet.breed ? ` · ${pet.breed}` : ''}
          </p>
          {(pet.color || sizeLabel) && (
            <p className="mt-0.5 text-xs text-[rgb(var(--color-fg-muted))]">
              {[pet.color, sizeLabel].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-[rgb(var(--color-fg-subtle))]">
          <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{[pet.neighborhood, pet.city].filter(Boolean).join(', ')}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-[rgb(var(--color-fg-subtle))]">
            <Clock className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
            <span>{formatTimeAgo(pet.created_at)}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-[rgb(var(--color-fg-subtle))] group-hover:text-[rgb(var(--color-primary))] transition-colors duration-200" aria-hidden="true" />
        </div>
      </div>
    </Link>
  )
}
