// components/pets/PetCard.tsx — card individual de pet, listagem pública

import Link  from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, ChevronRight, Eye } from 'lucide-react'
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

// Pet perdido há 7+ dias entra em destaque de urgência
const DAYS_URGENT = 7

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}


interface PetCardProps {
  pet: PetPublic
}

export function PetCard({ pet }: PetCardProps) {
  const speciesLabel = SPECIES_LABEL[pet.species ?? ''] ?? 'Animal'
  const sizeLabel    = SIZE_LABEL[pet.size ?? ''] ?? ''
  const displayName  = pet.name ? `${pet.name} · ${speciesLabel}` : speciesLabel
  const isLost       = pet.kind === 'lost'

  // Urgência derivada da data do evento (perda) — sem campo dedicado no schema
  const referenceDate = pet.event_date ?? pet.created_at
  const daysMissing   = daysSince(referenceDate)
  const isUrgent      = isLost && pet.status === 'active' && daysMissing >= DAYS_URGENT

  return (
    <article
      className={`
        group relative flex flex-col rounded-xl overflow-hidden
        border bg-[rgb(var(--color-bg-raised))]
        transition-[border-color,box-shadow,transform] duration-200
        hover:border-[rgb(var(--color-border-strong))] hover:shadow-lg hover:shadow-black/20
        motion-safe:hover:-translate-y-0.5
        ${isUrgent
          ? 'border-brand-500 ring-2 ring-brand-500/60 shadow-[0_0_0_3px_rgba(255,133,27,0.15)]'
          : 'border-[rgb(var(--color-border))]'}
      `}
    >
      {/* Área clicável principal → detalhe do pet */}
      <Link
        href={`/achados-e-perdidos/${pet.id}`}
        className="flex flex-col"
        aria-label={`${isLost ? 'Pet perdido' : 'Pet encontrado'}: ${pet.name ?? speciesLabel} em ${pet.city}`}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[rgb(var(--color-bg-overlay))]">
          {pet.photo_url ? (
            <Image
              src={pet.photo_url}
              alt={pet.name ? `Foto de ${pet.name}` : `Foto de ${speciesLabel}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-200 motion-safe:group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl" aria-hidden="true">
              {pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : '🐾'}
            </div>
          )}
          <div className="absolute left-2 top-2"><SOSBadge kind={pet.kind as PetKind} /></div>
        </div>

        <div className="flex flex-col gap-2 p-4">
          <div>
            <p className="text-base font-bold text-[rgb(var(--color-fg))] leading-tight">
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
            {isUrgent ? (
              <div className="flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
                <Clock className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <span>Desaparecido há {daysMissing} dias</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-[rgb(var(--color-fg-subtle))]">
                <Clock className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <span>{formatTimeAgo(pet.created_at)}</span>
              </div>
            )}
            <ChevronRight className="h-4 w-4 text-[rgb(var(--color-fg-subtle))] group-hover:text-[rgb(var(--color-primary))] transition-colors duration-200" aria-hidden="true" />
          </div>
        </div>
      </Link>

      {/* Botão rápido de avistamento — só para pets perdidos */}
      {isLost && (
        <div className="px-4 pb-4">
          <Link
            href={`/avistamentos/novo?pet=${pet.id}`}
            className="
              flex items-center justify-center gap-1.5 w-full
              rounded-lg border border-[rgb(var(--color-border))]
              bg-[rgb(var(--color-bg-overlay))] px-3 py-2
              text-xs font-medium text-[rgb(var(--color-fg-muted))]
              hover:border-[#FF851B]/50 hover:text-[#FF851B] hover:bg-[#FF851B]/5
              transition-[color,background-color,border-color,opacity] duration-150
              sm:opacity-0 sm:group-hover:opacity-100
              focus-visible:opacity-100
              motion-reduce:opacity-100
            "
          >
            <Eye className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            Vi esse animal
          </Link>
        </div>
      )}
    </article>
  )
}
