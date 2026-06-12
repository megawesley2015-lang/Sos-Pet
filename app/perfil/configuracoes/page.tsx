'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2, Mail, MessageCircle } from 'lucide-react'

const CIDADES = [
  'Santos', 'Guarujá', 'São Vicente', 'Cubatão', 'Bertioga',
  'Praia Grande', 'Mongaguá', 'Itanhaém', 'Peruíbe',
]

type Channel = 'whatsapp' | 'email'

type Sub = {
  id: string
  city: string
  channel: Channel
  active: boolean
}

type Status = 'idle' | 'loading' | 'saving'

export default function ConfiguracoesPage() {
  const [subs, setSubs] = useState<Sub[]>([])
  const [hasPhone, setHasPhone] = useState(false)
  const [status, setStatus] = useState<Status>('loading')
  const [toast, setToast] = useState('')

  useEffect(() => {
    async function load() {
      const [subsRes, profileRes] = await Promise.all([
        fetch('/api/notifications/subscriptions'),
        fetch('/api/profile/me').catch(() => null),
      ])
      if (subsRes.ok) {
        const data = await subsRes.json()
        setSubs(data.data?.subscriptions ?? [])
      }
      if (profileRes?.ok) {
        const p = await profileRes.json()
        setHasPhone(!!(p.data?.telefone))
      }
      setStatus('idle')
    }
    load()
  }, [])

  function isActive(city: string, channel: Channel) {
    return subs.some(s => s.city === city && s.channel === channel && s.active)
  }

  function getSubId(city: string, channel: Channel) {
    return subs.find(s => s.city === city && s.channel === channel)?.id
  }

  async function toggle(city: string, channel: Channel) {
    const active = isActive(city, channel)
    const subId = getSubId(city, channel)
    setStatus('saving')

    if (active && subId) {
      await fetch('/api/notifications/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subId }),
      })
      setSubs(prev => prev.filter(s => s.id !== subId))
    } else {
      const res = await fetch('/api/notifications/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, channel }),
      })
      if (res.ok) {
        const subsRes = await fetch('/api/notifications/subscriptions')
        if (subsRes.ok) {
          const data = await subsRes.json()
          setSubs(data.data?.subscriptions ?? [])
        }
        setToast(`Alerta ativado: ${channel} para ${city}`)
        setTimeout(() => setToast(''), 3000)
      }
    }
    setStatus('idle')
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-fg">Configurações</h1>
      <p className="mb-8 text-sm text-fg-muted">Gerencie seus alertas de pets perdidos.</p>

      {toast && (
        <div className="mb-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          {toast}
        </div>
      )}

      <section>
        <h2 className="mb-4 text-base font-semibold text-fg">Alertas de pets perdidos</h2>
        <p className="mb-6 text-xs text-fg-muted">
          Receba notificações quando um pet for perdido nas cidades selecionadas.
        </p>

        {!hasPhone && (
          <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
            Adicione um telefone ao seu perfil para ativar alertas via WhatsApp.
          </div>
        )}

        <div className="space-y-3">
          {CIDADES.map(city => (
            <div
              key={city}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-700/40 px-4 py-3"
            >
              <span className="text-sm font-medium text-fg">{city}</span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!hasPhone || status === 'saving'}
                  onClick={() => toggle(city, 'whatsapp')}
                  title={!hasPhone ? 'Adicione um telefone ao perfil primeiro' : undefined}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                    isActive(city, 'whatsapp')
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-ink-600 text-fg-muted hover:bg-ink-500'
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {isActive(city, 'whatsapp') ? 'WhatsApp ✓' : 'WhatsApp'}
                </button>

                <button
                  type="button"
                  disabled={status === 'saving'}
                  onClick={() => toggle(city, 'email')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                    isActive(city, 'email')
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-ink-600 text-fg-muted hover:bg-ink-500'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  {isActive(city, 'email') ? 'Email ✓' : 'Email'}
                </button>

                {isActive(city, 'whatsapp') || isActive(city, 'email') ? (
                  <Bell className="h-4 w-4 text-brand-500" />
                ) : (
                  <BellOff className="h-4 w-4 text-fg-subtle" />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
