// app/achados-e-perdidos/[id]/page.tsx — detalhe do pet, único lugar com contato

import { cache }        from 'react'
import { notFound }     from 'next/navigation'
import Link             from 'next/link'
import Image            from 'next/image'
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server'
import { ShareButton }  from '@/components/pets/ShareButton'
import { PET_DETAIL_COLUMNS, type PetDetail } from '@/types/pets'

// React.cache() garante deduplicação: generateMetadata e PetDetailPage
// compartilham o mesmo resultado dentro do mesmo request.
const getCachedPet = cache(async (id: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('pets')
    .select(PET_DETAIL_COLUMNS)
    .eq('id', id)
    .single()
  return data
})

const SPECIES_LABEL: Record<string, string> = { dog: 'Cachorro', cat: 'Gato', other: 'Animal' }
const SIZE_LABEL:    Record<string, string> = { small: 'Pequeno', medium: 'Médio', large: 'Grande' }
const SEX_LABEL:     Record<string, string> = { male: 'Macho', female: 'Fêmea', unknown: 'Não informado' }

// Next.js 15+: params é Promise
type PageParams = { params: Promise<{ id: string }>; searchParams: Promise<{ novo?: string }> }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data   = await getCachedPet(id) as PetDetail | null

  if (!data) return { title: 'Pet não encontrado — SOS Pet Aumigo' }

  const kind    = data.kind === 'lost' ? 'Perdido' : 'Encontrado'
  const species = SPECIES_LABEL[data.species] ?? 'Pet'
  const name    = data.name ?? species

  return {
    title:       `${kind}: ${name} em ${data.city} — SOS Pet Aumigo`,
    description: `${kind}: ${name} (${species}) em ${data.city}. Ajude a encontrar!`,
    openGraph:   {
      title:  `${kind}: ${name} — SOS Pet Aumigo`,
      images: data.photo_url ? [data.photo_url] : [],
    },
  }
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex flex-col rounded-lg border border-border bg-bg-raised px-3 py-2 text-center shadow-warm-card">
      <span className="text-[10px] text-fg-subtle uppercase tracking-wider">{label}</span>
      <span className="mt-0.5 text-sm font-medium text-fg">{value}</span>
    </span>
  )
}

export default async function PetDetailPage({ params, searchParams }: PageParams) {
  const { id }   = await params
  const { novo } = await searchParams
  const data     = await getCachedPet(id)

  if (!data) notFound()

  const pet          = data as unknown as PetDetail
  const isLost       = pet.kind === 'lost'
  const speciesLabel = SPECIES_LABEL[pet.species] ?? 'Animal'
  const displayName  = pet.name ?? speciesLabel

  const whatsappLink = pet.contact_whatsapp && pet.contact_phone
    ? `https://wa.me/55${pet.contact_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Olá! Vi o alerta do SOS Pet Aumigo sobre ${isLost ? 'o pet perdido' : 'o pet encontrado'} "${displayName}" e tenho informações!`
      )}`
    : null

  return (
    <main data-theme="light" className="min-h-screen bg-bg">
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-fg-subtle">
        <Link href="/achados-e-perdidos" className="hover:text-brand-500 transition-colors">
          Achados & Perdidos
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-fg-muted">{displayName}</span>
      </nav>

      {/* Banner de sucesso */}
      {novo === 'true' && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/10 p-4">
          <p className="text-sm font-medium text-accent">
            ✓ Alerta cadastrado com sucesso! Compartilhe para aumentar as chances de reencontro.
          </p>
        </div>
      )}

      {/* Foto */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-bg-overlay shadow-warm-card">
        {pet.photo_url ? (
          <Image
            src={pet.photo_url}
            alt={`Foto de ${displayName}`}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl" aria-hidden="true">
            {pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : '🐾'}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {/* Badge + data */}
        <div className="flex items-center gap-3">
          <span className={`
            inline-flex items-center gap-1.5 rounded-full px-3 py-1 border
            font-bold uppercase tracking-wide
            ${isLost
              ? 'bg-[#FFF4E8] text-[#9A4E00] border-[#FF9933]/40'
              : 'bg-[#E1F5EE] text-[#0F6E56] border-[#20B2AA]/40'}
          `}>
            <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isLost ? 'bg-[#FF9933]' : 'bg-[#20B2AA]'}`} />
            {isLost ? 'Perdido' : 'Encontrado'}
          </span>
          <span className="text-xs text-fg-subtle">
            {new Date(pet.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <h1 className="text-2xl font-black text-fg">
          {displayName}
          {pet.breed && <span className="ml-2 text-lg font-normal text-fg-muted">· {pet.breed}</span>}
        </h1>

        {/* Tags de características */}
        <div className="flex flex-wrap gap-2">
          <Tag label="Espécie" value={speciesLabel} />
          {pet.color && <Tag label="Cor"   value={pet.color} />}
          {pet.size  && <Tag label="Porte" value={SIZE_LABEL[pet.size]  ?? pet.size} />}
          {pet.sex   && <Tag label="Sexo"  value={SEX_LABEL[pet.sex]    ?? pet.sex} />}
          {pet.age_approx && <Tag label="Idade" value={pet.age_approx} />}
        </div>

        {pet.description && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">Descrição</p>
            <p className="text-sm leading-relaxed text-fg-muted">{pet.description}</p>
          </div>
        )}

        {pet.behavior && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">Comportamento</p>
            <p className="text-sm text-fg-muted">{pet.behavior}</p>
          </div>
        )}

        {/* Localização */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-fg-subtle">
            {isLost ? 'Última localização' : 'Onde foi encontrado'}
          </p>
          <p className="text-sm text-fg">
            {[pet.neighborhood, pet.city, pet.state].filter(Boolean).join(', ')}
          </p>
          {pet.event_date && (
            <p className="mt-0.5 text-xs text-fg-subtle">
              {isLost ? 'Desapareceu em' : 'Encontrado em'}{' '}
              {new Date(pet.event_date + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {/* Contato — único lugar da aplicação com esses dados */}
        <div className="rounded-xl border border-border bg-bg-raised p-5 flex flex-col gap-4 shadow-warm-card">
          <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
            Entrar em contato
          </p>

          {pet.contact_name && (
            <p className="text-sm text-fg">
              <span className="text-fg-muted">Nome: </span>
              {pet.contact_name}
            </p>
          )}

          {pet.contact_phone && (
            <a
              href={`tel:${pet.contact_phone}`}
              className="
                flex items-center justify-center gap-2 rounded-full
                border border-border bg-bg-overlay
                px-6 py-3 text-sm font-medium text-fg
                hover:border-border transition-colors
              "
            >
              📞 Ligar: {pet.contact_phone}
            </a>
          )}

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] text-white px-6 py-3 text-sm font-semibold hover:bg-[#22c55e] transition-colors"
            >
              💬 Chamar no WhatsApp
            </a>
          )}
        </div>

        <ShareButton petName={displayName} />

        <Link
          href="/achados-e-perdidos"
          className="text-center text-xs text-fg-subtle hover:text-brand-500 transition-colors"
        >
          ← Ver todos os alertas
        </Link>
      </div>
    </div>
    </main>
  )
}
