'use client'
// components/HeroSection.tsx — Hero da Home, design system v3 warm light

import Link from 'next/link'
import { AlertTriangle, Search, Zap } from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface AlertaRecente {
  id:            string
  nome?:         string
  especie:       string
  status:        'perdido' | 'encontrado'
  cidade:        string
  tempoRelativo: string
  foto_url?:     string
}

interface HeroSectionProps {
  alertasRecentes?: AlertaRecente[]
  totalAtivos?:     number
}

// ── Painel de alertas (coluna direita) ───────────────────────────────────────

function PainelAlertas({
  alertas,
  totalAtivos,
}: {
  alertas:     AlertaRecente[]
  totalAtivos: number
}) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[rgb(var(--color-border))] bg-white shadow-[0_4px_24px_rgba(26,18,8,0.06)]">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-raised))]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--color-accent))] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[rgb(var(--color-accent))]" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-fg-subtle))]">
            Alertas recentes
          </span>
        </div>
        <span className="text-xs text-[rgb(var(--color-fg-muted))]">
          {totalAtivos} ativo{totalAtivos !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista */}
      <ul className="divide-y divide-[rgb(var(--color-border))]">
        {alertas.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-[rgb(var(--color-fg-muted))]">
            Nenhum alerta recente ainda.<br />
            <span className="font-medium" style={{ color: 'var(--color-brand-500)' }}>
              Seja o primeiro a cadastrar.
            </span>
          </li>
        ) : (
          alertas.slice(0, 5).map((alerta) => (
            <li key={alerta.id}>
              <Link
                href={`/achados-e-perdidos/${alerta.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--color-bg-overlay))] transition-colors duration-150 group"
              >
                {/* Avatar emoji */}
                <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base bg-[rgb(var(--color-bg-overlay))] border border-[rgb(var(--color-border))]">
                  {alerta.especie === 'cachorro' ? '🐶'
                    : alerta.especie === 'gato' ? '🐱'
                    : alerta.especie === 'passaro' ? '🦜'
                    : '🐾'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`
                      inline-block rounded-full px-1.5 py-0.5
                      text-[10px] font-bold uppercase tracking-wider flex-shrink-0
                      ${alerta.status === 'perdido'
                        ? 'bg-[rgb(var(--color-primary))]/12 text-[rgb(var(--color-primary))]'
                        : 'bg-[rgb(var(--color-accent))]/12 text-[rgb(var(--color-accent))]'
                      }
                    `}>
                      {alerta.status}
                    </span>
                    <p className="text-sm font-semibold text-[rgb(var(--color-fg))] truncate">
                      {alerta.nome ?? 'Sem nome'} · {alerta.especie}
                    </p>
                  </div>
                  <p className="text-xs text-[rgb(var(--color-fg-muted))] truncate mt-0.5">
                    📍 {alerta.cidade}
                  </p>
                </div>

                {/* Tempo */}
                <span className="text-[11px] text-[rgb(var(--color-fg-subtle))] flex-shrink-0 group-hover:text-[rgb(var(--color-primary))] transition-colors duration-150">
                  {alerta.tempoRelativo}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-raised))]">
        <Link
          href="/achados-e-perdidos"
          className="text-xs font-semibold transition-colors duration-150 flex items-center gap-1"
          style={{ color: 'var(--color-brand-500)' }}
        >
          Ver todos os pets na rede →
        </Link>
      </div>
    </div>
  )
}

// ── Hero principal ────────────────────────────────────────────────────────────

export default function HeroSection({
  alertasRecentes = [],
  totalAtivos     = 0,
}: HeroSectionProps) {
  return (
    <section
      aria-label="Reencontre seu pet perdido"
      className="relative overflow-hidden bg-[rgb(var(--color-bg))] bg-warm-grid pt-16 pb-20 md:pt-24 md:pb-28 px-4"
    >
      {/* Aura decorativa */}
      <div className="pointer-events-none absolute inset-0 bg-radial-warm opacity-60" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* ── Coluna esquerda: copy ── */}
          <div className="flex flex-col gap-6">

            {/* Pill */}
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
                style={{
                  borderColor:     'rgba(var(--color-primary), 0.25)',
                  backgroundColor: 'rgba(var(--color-primary), 0.10)',
                  color:           'rgb(var(--color-primary))',
                }}
              >
                <Zap size={11} fill="currentColor" aria-hidden="true" />
                Rede colaborativa de resgate
              </span>
            </div>

            {/* Heading — texto escuro sobre creme, contraste 15:1 */}
            <h1 className="text-4xl font-black leading-[1.1] text-[rgb(var(--color-fg))] md:text-5xl lg:text-6xl">
              Reencontre{' '}
              <br className="hidden sm:block" />
              quem{' '}
              <span style={{ color: 'var(--color-brand-500)' }}>se perdeu.</span>
            </h1>

            <p className="max-w-md text-base text-[rgb(var(--color-fg-muted))] leading-relaxed md:text-lg">
              Cadastre seu pet desaparecido, dispare um alerta de resgate e
              conte com a rede pra trazer ele de volta.{' '}
              <strong className="font-semibold text-[rgb(var(--color-fg))]">Em segundos.</strong>
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              {/* Primário: laranja sólido via style — fallback se bg-brand-500 não resolver */}
              <Link
                href="/achados-e-perdidos/cadastrar"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: 'var(--color-brand-500)',
                  boxShadow:       '0 2px 12px rgba(255,107,53,0.30)',
                  outlineColor:    'var(--color-brand-500)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-brand-600)'
                  e.currentTarget.style.boxShadow       = '0 4px 16px rgba(255,107,53,0.40)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-brand-500)'
                  e.currentTarget.style.boxShadow       = '0 2px 12px rgba(255,107,53,0.30)'
                }}
              >
                <AlertTriangle size={15} aria-hidden="true" />
                Cadastrar pet perdido →
              </Link>

              {/* Secundário: outline teal */}
              <Link
                href="/achados-e-perdidos"
                className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold bg-transparent transition-all duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  borderColor:  'rgb(var(--color-accent))',
                  color:        'rgb(var(--color-accent))',
                  outlineColor: 'rgb(var(--color-accent))',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(var(--color-accent), 0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <Search size={14} aria-hidden="true" />
                Ver pets na rede
              </Link>
            </div>

            {/* Trust line */}
            <p className="text-xs text-[rgb(var(--color-fg-subtle))] flex flex-wrap gap-x-3 gap-y-1">
              <span>✓ 100% gratuito</span>
              <span>✓ sem login obrigatório</span>
              <span>✓ verificação anti-spam automática</span>
              <span>✓ você no controle</span>
            </p>
          </div>

          {/* ── Coluna direita: painel alertas ── */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <PainelAlertas alertas={alertasRecentes} totalAtivos={totalAtivos} />
          </div>

        </div>
      </div>
    </section>
  )
}
