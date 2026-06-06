'use client'
// components/FaixaParceiros.tsx — Faixa de Parceiros Locais
// Invisível se zero parceiros | badge só se verificado=true
// | card clicável só se site_url presente | logo ausente → iniciais

import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Building2 } from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface Parceiro {
  id:                 string
  nome:               string
  cidade:             string
  logo_url?:          string | null
  site_url?:          string | null
  verificado:         boolean
  categoria_parceiro?: string | null
}

interface FaixaParceirosProps {
  parceiros: Parceiro[]
}

// ── Utilitários ───────────────────────────────────────────────────────────────

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

const LABEL_CATEGORIA: Record<string, string> = {
  veterinario: 'Veterinário',
  petshop:     'Pet Shop',
  adestrador:  'Adestrador',
  hospedagem:  'Hospedagem',
  banho_tosa:  'Banho & Tosa',
  outro:       'Parceiro',
}

// ── Card ──────────────────────────────────────────────────────────────────────

function CardParceiro({ parceiro }: { parceiro: Parceiro }) {
  const label = parceiro.categoria_parceiro
    ? (LABEL_CATEGORIA[parceiro.categoria_parceiro] ?? 'Parceiro')
    : 'Parceiro'

  const inner = (
    <div className="
      group relative flex flex-col items-center gap-3
      rounded-2xl border border-[rgb(var(--color-border))]
      bg-white px-5 py-5 text-center
      shadow-[0_1px_4px_rgba(26,18,8,0.05)]
      transition-all duration-200
      hover:border-[rgb(var(--color-primary))]/40
      hover:shadow-[0_4px_16px_rgba(255,107,53,0.08)]
      w-40 flex-shrink-0
    ">
      {/* Badge verificado */}
      {parceiro.verificado && (
        <span
          className="
            absolute -top-2 -right-2 inline-flex items-center gap-1
            rounded-full border border-[rgb(var(--color-accent))]/30
            bg-white px-1.5 py-0.5
            text-[10px] font-bold uppercase tracking-wider text-teal-700
          "
          title="Parceiro verificado pelo SOS Pet"
        >
          <CheckCircle size={10} className="text-[rgb(var(--color-accent))]" aria-hidden="true" />
          Verificado
        </span>
      )}

      {/* Logo ou avatar iniciais */}
      <div className="
        relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full
        border-2 border-[rgb(var(--color-border))]
        bg-[rgb(var(--color-bg-overlay))]
        flex items-center justify-center
      ">
        {parceiro.logo_url ? (
          <Image
            src={parceiro.logo_url}
            alt={`Logo ${parceiro.nome}`}
            fill
            sizes="56px"
            className="object-contain p-1"
          />
        ) : (
          <span className="text-lg font-black text-[rgb(var(--color-primary))]">
            {iniciais(parceiro.nome)}
          </span>
        )}
      </div>

      <p className="text-xs font-bold leading-tight text-[rgb(var(--color-fg))] line-clamp-2 w-full">
        {parceiro.nome}
      </p>

      <div className="flex flex-col gap-0.5">
        <span className="inline-block rounded-full bg-[rgb(var(--color-bg-overlay))] px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--color-fg-muted))]">
          {label}
        </span>
        <p className="text-[10px] text-[rgb(var(--color-fg-subtle))] truncate w-full">
          {parceiro.cidade}
        </p>
      </div>

      {parceiro.site_url && (
        <span className="text-[10px] text-[rgb(var(--color-primary))] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          Visitar site →
        </span>
      )}
    </div>
  )

  if (parceiro.site_url) {
    return (
      <a href={parceiro.site_url} target="_blank" rel="noopener noreferrer" aria-label={`Visitar site de ${parceiro.nome}`}>
        {inner}
      </a>
    )
  }

  return <div>{inner}</div>
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function FaixaParceiros({ parceiros }: FaixaParceirosProps) {
  if (!parceiros || parceiros.length === 0) return null

  const verificados = parceiros.filter((p) => p.verificado).length

  return (
    <section aria-labelledby="parceiros-heading" className="bg-[rgb(var(--color-bg))] py-16 px-4">
      <div className="mx-auto max-w-6xl">

        {/* Cabeçalho */}
        <div className="mb-10 flex flex-col gap-3 items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--color-accent))]/25 bg-[rgb(var(--color-accent))]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-700">
            <Building2 size={11} aria-hidden="true" />
            Parceiros da rede
          </span>

          <h2 id="parceiros-heading" className="text-2xl font-black text-[rgb(var(--color-fg))] md:text-3xl">
            Estabelecimentos que{' '}
            <span className="text-[rgb(var(--color-primary))]">confiam no SOS Pet.</span>
          </h2>

          <p className="text-sm text-[rgb(var(--color-fg-muted))] max-w-md leading-relaxed">
            Clínicas e pet shops que indicam o SOS Pet para seus clientes e ajudam
            a ampliar a rede de resgate na Baixada Santista.
          </p>

          {verificados > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-teal-700 font-semibold">
              <CheckCircle size={12} aria-hidden="true" />
              {verificados} estabelecimento{verificados !== 1 ? 's' : ''} verificado{verificados !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Faixa — scroll horizontal mobile, wrap desktop */}
        <div
          className="flex gap-4 overflow-x-auto pb-3 md:flex-wrap md:justify-center md:overflow-x-visible md:pb-0 scrollbar-hide"
          role="list"
          aria-label="Lista de parceiros"
        >
          {parceiros.map((parceiro) => (
            <div key={parceiro.id} role="listitem">
              <CardParceiro parceiro={parceiro} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/parceiros"
            className="group inline-flex items-center gap-2 rounded-full border border-[rgb(var(--color-border-strong))] bg-white px-6 py-3 text-sm font-semibold text-[rgb(var(--color-fg-muted))] hover:border-[rgb(var(--color-primary))]/40 hover:text-[rgb(var(--color-fg))] transition-all duration-200"
          >
            Seja um parceiro
            <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">→</span>
          </Link>
        </div>

      </div>
    </section>
  )
}
