'use client'
// components/HallRreencontros.tsx — Hall de Reencontros
// Schema real: name, species ('dog'|'cat'|'other'), breed, city, photo_url, event_date, resolved_at

import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Clock, ArrowRight } from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface PetReencontrado {
  id: string
  name: string | null
  species: 'dog' | 'cat' | 'other'
  breed?: string | null
  city: string
  photo_url: string | null
  event_date: string   // data do desaparecimento / encontro (coluna event_date)
  resolved_at: string  // data da resolução (coluna updated_at quando status='resolved')
  testimonial?: string | null
}

interface HallRreencontrosProps {
  pets: PetReencontrado[]
  resolvedCount?: number
  verTodos?: boolean
}

// ── Utilitários ───────────────────────────────────────────────────────────────

function calcularTempo(inicio: string, fim: string): string {
  const ms    = new Date(fim).getTime() - new Date(inicio).getTime()
  const horas = Math.floor(ms / 1000 / 60 / 60)
  const dias  = Math.floor(horas / 24)
  if (horas < 1)  return 'menos de 1h'
  if (horas < 24) return `${horas}h`
  if (dias === 1) return '1 dia'
  if (dias < 7)   return `${dias} dias`
  const semanas = Math.floor(dias / 7)
  return semanas === 1 ? '1 semana' : `${semanas} semanas`
}

function estiloTempo(inicio: string, fim: string): string {
  const horas = (new Date(fim).getTime() - new Date(inicio).getTime()) / 1000 / 60 / 60
  if (horas <= 24) return 'text-[#0F6E56] border-[#20B2AA]/30 bg-[#E1F5EE]'
  if (horas <= 72) return 'text-[#0F6E56] border-[#20B2AA]/20 bg-[#F0FDFB]'
  return 'text-[#9A4E00] border-[#FF851B]/30 bg-[#FFF4E8]'
}

const EMOJI: Record<PetReencontrado['species'], string> = {
  dog: '🐶', cat: '🐱', other: '🐾',
}

// ── Card ──────────────────────────────────────────────────────────────────────

function CardRreencontro({
  pet,
  destaque = false,
}: {
  pet: PetReencontrado
  destaque?: boolean
}) {
  const tempo   = calcularTempo(pet.event_date, pet.resolved_at)
  const estilo  = estiloTempo(pet.event_date, pet.resolved_at)
  const nomePet = pet.name ?? 'Pet sem nome'

  return (
    <article
      className={[
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'bg-white border border-warm-200',
        'shadow-warm-card hover:shadow-warm-hover hover:border-brand-400/40',
        'transition-shadow transition-colors',
        'transition-all duration-300',
        destaque ? 'md:col-span-2' : '',
      ].join(' ')}
      aria-label={`${nomePet} foi reencontrado em ${tempo}`}
    >
      {/* Foto ou fallback emoji */}
      <div className={`relative overflow-hidden bg-warm-100 ${destaque ? 'h-72 md:h-80' : 'h-52'}`}>
        {pet.photo_url ? (
          <Image
            src={pet.photo_url}
            alt={`Foto de ${nomePet}`}
            fill
            sizes={destaque ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl select-none">
            {EMOJI[pet.species]}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />

        <span className="absolute top-3 left-3 text-lg select-none drop-shadow-sm" aria-hidden="true">
          {EMOJI[pet.species]}
        </span>

        <span className={`absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold backdrop-blur-sm ${estilo}`}>
          <Clock size={11} aria-hidden="true" />
          {tempo}
        </span>

        <span className="absolute bottom-3 right-3" aria-hidden="true">
          <Heart
            size={18}
            className="text-brand-500 drop-shadow-[0_0_6px_rgba(255,107,53,0.5)]"
            fill="currentColor"
          />
        </span>
      </div>

      {/* Corpo */}
      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-base font-bold text-fg leading-tight">
          {nomePet}
          {pet.breed && (
            <span className="ml-2 text-xs font-normal text-fg-muted">{pet.breed}</span>
          )}
        </h3>

        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <MapPin size={11} className="text-brand-400 flex-shrink-0" aria-hidden="true" />
          {pet.city}
        </p>

        {destaque && pet.testimonial && (
          <blockquote className="mt-1 border-l-2 border-brand-400/40 pl-3 text-xs italic text-ink-600 leading-relaxed line-clamp-2">
            &ldquo;{pet.testimonial}&rdquo;
          </blockquote>
        )}

        <div className="mt-1 h-px bg-warm-200" />

        <p className="text-xs text-fg-subtle uppercase tracking-wider font-medium">
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[#E1F5EE] text-[#0F6E56] border border-[#20B2AA]/40">✓ Reencontrado</span>
        </p>
      </div>
    </article>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function HallRreencontros({
  pets,
  resolvedCount,
  verTodos = true,
}: HallRreencontrosProps) {
  if (pets.length === 0) return null

  const [destaque, ...demais] = pets
  const contador = resolvedCount ?? pets.length

  return (
    <section
      aria-labelledby="hall-heading"
      className="bg-warm-50 pt-10 pb-16 px-4"
    >
      <div className="mx-auto max-w-6xl">

        {/* Cabeçalho */}
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-lg">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-700">
              <Heart size={11} fill="currentColor" aria-hidden="true" />
              Histórias reais
            </p>

            <h2
              id="hall-heading"
              className="text-3xl font-black text-fg leading-tight md:text-4xl"
            >
              Eles voltaram{' '}
              <span className="text-brand-500">para casa.</span>
            </h2>

            <p className="mt-3 text-sm text-fg-muted leading-relaxed max-w-sm">
              Cada reencontro aqui é real. Cada hora contada é a diferença
              que o SOS Pet Aumigo fez na vida de um tutor.
            </p>
          </div>

          {/* Contador */}
          <div className="flex items-center gap-3 rounded-2xl border border-warm-300 bg-white px-5 py-4 self-start md:self-auto shadow-sm">
            <span
              className="text-4xl font-black text-brand-500 tabular-nums leading-none"
              aria-label={`${contador} pets reencontrados`}
            >
              {contador}
            </span>
            <span className="text-xs text-fg-muted leading-tight">
              pets<br />reencontrados
            </span>
          </div>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {destaque && <CardRreencontro pet={destaque} destaque />}
          {demais.map((pet) => (
            <CardRreencontro key={pet.id} pet={pet} />
          ))}
        </div>

        {/* Link ver todos */}
        {verTodos && (
          <div className="mt-10 flex justify-center">
            <Link
              href="/achados-e-perdidos?status=resolved"
              className="group inline-flex items-center gap-2 rounded-full border border-warm-300 bg-white px-6 py-3 text-sm font-semibold text-brand-600 transition-all duration-200 hover:border-brand-400/40 hover:text-brand-500 transition-colors"
            >
              Ver todos os reencontros
              <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
