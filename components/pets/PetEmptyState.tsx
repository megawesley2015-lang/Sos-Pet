'use client'

import { MascotBubble } from '@/components/ui/MascotBubble'

interface PetEmptyStateProps {
  message?: string
}

export function PetEmptyState({
  message = 'Nenhum pet encontrado com esses filtros.',
}: PetEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <MascotBubble
        pose="dog-detective"
        message={message}
        size={96}
        side="right"
      />
      <p className="text-xs text-fg-subtle">
        Tente ajustar os filtros ou{' '}
        <a href="/pets/novo" className="font-semibold text-brand-600 hover:underline">
          cadastre um novo pet
        </a>
        .
      </p>
    </div>
  )
}
