'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, X } from 'lucide-react'

type TargetType = 'pet' | 'sighting'

type Reason = 'spam' | 'inappropriate_photo' | 'wrong_info' | 'other'

const REASON_LABELS: Record<Reason, string> = {
  spam: 'Spam ou conteúdo repetido',
  inappropriate_photo: 'Foto imprópria',
  wrong_info: 'Informação incorreta',
  other: 'Outro motivo',
}

type Props = {
  targetType: TargetType
  targetId: string
  isAuthenticated: boolean
}

export function ReportButton({ targetType, targetId, isAuthenticated }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Reason | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  function handleClick() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setOpen(true)
  }

  async function handleSubmit() {
    if (!selected) return
    setStatus('loading')

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: targetType, target_id: targetId, reason: selected }),
    })

    if (res.ok || res.status === 409) {
      setStatus('done')
      setOpen(false)
    } else {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
        <Flag className="h-3 w-3" />
        Denunciado
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1 text-xs text-fg-subtle hover:text-fg-muted"
        title="Denunciar"
      >
        <Flag className="h-3 w-3" />
        Denunciar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">Por que está denunciando?</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-fg-muted hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {(Object.entries(REASON_LABELS) as [Reason, string][]).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 hover:bg-ink-700"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={value}
                    checked={selected === value}
                    onChange={() => setSelected(value)}
                    className="accent-brand-500"
                  />
                  <span className="text-sm text-fg">{label}</span>
                </label>
              ))}
            </div>

            {status === 'error' && (
              <p className="mt-3 text-xs text-danger-fg">Erro ao enviar. Tente novamente.</p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selected || status === 'loading'}
              className="mt-4 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {status === 'loading' ? 'Enviando…' : 'Enviar denúncia'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
