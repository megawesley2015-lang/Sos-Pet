'use client'

import { cn } from '@/lib/utils/cn'

/**
 * Poses disponíveis no sprite sheet (1408×768, grid 4×2).
 * Linha 0 = cachorros, linha 1 = gatos.
 */
export type MascotPose =
  | 'dog-wave'       // cachorro acenando (col 0, row 0)
  | 'dog-detective'  // cachorro com lupa + mapa (col 1, row 0)
  | 'dog-run'        // cachorro correndo (col 2, row 0)
  | 'dog-sad'        // cachorro triste/perdido (col 3, row 0)
  | 'cat-sit'        // gata sentada calma (col 0, row 1)
  | 'cat-detective'  // gata detetive (col 1, row 1)
  | 'cat-pair'       // dupla cão+gato (col 2, row 1)
  | 'cat-flag'       // gata comemorando (col 3, row 1)

const POSES: Record<MascotPose, [col: number, row: number]> = {
  'dog-wave':      [0, 0],
  'dog-detective': [1, 0],
  'dog-run':       [2, 0],
  'dog-sad':       [3, 0],
  'cat-sit':       [0, 1],
  'cat-detective': [1, 1],
  'cat-pair':      [2, 1],
  'cat-flag':      [3, 1],
}

// Dimensões originais do sprite
const SPRITE_W = 1408
const SPRITE_H = 768
const CHAR_W   = 352  // SPRITE_W / 4
const CHAR_H   = 384  // SPRITE_H / 2

interface MascotBubbleProps {
  pose?: MascotPose
  message: string
  size?: number        // largura do personagem em px (default 80)
  side?: 'right' | 'left'
  className?: string
}

export function MascotBubble({
  pose = 'dog-wave',
  message,
  size = 80,
  side = 'right',
  className,
}: MascotBubbleProps) {
  const [col, row] = POSES[pose]
  const scale     = size / CHAR_W
  const bgW       = Math.round(SPRITE_W * scale)
  const bgH       = Math.round(SPRITE_H * scale)
  const posX      = Math.round(col * CHAR_W * scale)
  const posY      = Math.round(row * CHAR_H * scale)
  const displayH  = Math.round(CHAR_H * scale)

  const sprite = (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: displayH,
        backgroundImage: 'url(/avatar/mascot.png)',
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `-${posX}px -${posY}px`,
        backgroundRepeat: 'no-repeat',
        flexShrink: 0,
      }}
    />
  )

  const bubble = (
    <div
      className="relative max-w-[240px] rounded-2xl px-3 py-2.5 text-xs leading-relaxed"
      style={{
        background:   'var(--color-bg-raised)',
        color:        'var(--color-fg-muted)',
        border:       '1px solid var(--color-border)',
        boxShadow:    'var(--shadow-card)',
        borderRadius: side === 'right' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
      }}
    >
      {message}
    </div>
  )

  return (
    <div className={cn('flex items-end gap-3', side === 'left' && 'flex-row-reverse', className)}>
      {sprite}
      {bubble}
    </div>
  )
}
