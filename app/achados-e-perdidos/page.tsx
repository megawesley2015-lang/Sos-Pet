// app/achados-e-perdidos/page.tsx — listagem pública, Server Component + Suspense granular

import { Suspense }        from 'react'
import Link                from 'next/link'
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server'
import { PetGrid }         from '@/components/pets/PetGrid'
import { FilterBar }       from '@/components/pets/FilterBar'
import { PetGridSkeleton } from '@/components/skeletons/PetCardSkeleton'
import { PET_PUBLIC_COLUMNS, type PetPublic } from '@/types/pets'

// ── Sub-componente servidor que busca os dados ─────────────────────────────
async function PetList({
  kind, species, city, page,
}: {
  kind?: string; species?: string; city?: string; page: number
}) {
  const LIMIT  = 20
  const offset = (page - 1) * LIMIT

  const supabase = await createClient()
  let query = supabase
    .from('pets')
    .select(PET_PUBLIC_COLUMNS, { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + LIMIT - 1)

  if (kind)    query = query.eq('kind', kind as 'lost' | 'found')
  if (species) query = query.eq('species', species as 'dog' | 'cat' | 'other')
  if (city)    query = query.ilike('city', `%${city}%`)

  const { data, error, count } = await query

  if (error) {
    return (
      <p className="py-10 text-center text-sm text-[rgb(var(--color-fg-muted))]">
        Erro ao carregar pets. Tente novamente.
      </p>
    )
  }

  const pets       = (data ?? []) as unknown as PetPublic[]
  const total      = count ?? 0
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-[rgb(var(--color-fg-subtle))]">
        {total === 0
          ? 'Nenhum resultado'
          : `${total} alerta${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
      </p>

      <PetGrid pets={pets} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          {page > 1 && (
            <PaginationLink page={page - 1} kind={kind} species={species} city={city}>← Anterior</PaginationLink>
          )}
          <span className="text-xs text-[rgb(var(--color-fg-subtle))]">Página {page} de {totalPages}</span>
          {page < totalPages && (
            <PaginationLink page={page + 1} kind={kind} species={species} city={city}>Próxima →</PaginationLink>
          )}
        </div>
      )}
    </div>
  )
}

function PaginationLink({
  page, kind, species, city, children,
}: {
  page: number; kind?: string; species?: string; city?: string; children: React.ReactNode
}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  if (kind)    params.set('kind', kind)
  if (species) params.set('species', species)
  if (city)    params.set('city', city)
  return (
    <Link href={`/achados-e-perdidos?${params.toString()}`} className="text-xs text-[rgb(var(--color-primary))] hover:underline">
      {children}
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
// Next.js 15+: searchParams é Promise
interface PageProps {
  searchParams: Promise<{ kind?: string; species?: string; city?: string; page?: string }>
}

export const metadata = {
  title:       'Achados e Perdidos — SOS Pet',
  description: 'Pets perdidos e encontrados na sua região. Cadastre um alerta grátis.',
}

export default async function AchadosEPerdidosPage({ searchParams }: PageProps) {
  const sp      = await searchParams
  const kind    = sp.kind
  const species = sp.species
  const city    = sp.city
  const page    = Math.max(1, Number(sp.page ?? '1'))

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[rgb(var(--color-fg))]">
            Achados <span className="text-[rgb(var(--color-primary))]">&</span> Perdidos
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--color-fg-muted))]">Pets perdidos e encontrados na sua região</p>
        </div>

        <Link
          href="/achados-e-perdidos/cadastrar"
          className="
            inline-flex items-center gap-2 rounded-full
            bg-[rgb(var(--color-primary))] text-white
            px-6 py-3 text-sm font-semibold
            hover:bg-[rgb(var(--color-primary))]/90
            transition-all duration-200
            focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-[rgb(var(--color-primary))]
          "
        >
          🐾 Cadastrar alerta
        </Link>
      </div>

      {/* Filtros — client component */}
      <Suspense fallback={<FilterBarSkeleton />}>
        <FilterBar />
      </Suspense>

      {/* Lista — muda key para forçar Suspense no filtro */}
      <Suspense
        key={`${kind}-${species}-${city}-${page}`}
        fallback={<PetGridSkeleton count={8} />}
      >
        <PetList kind={kind} species={species} city={city} page={page} />
      </Suspense>
    </main>
  )
}

function FilterBarSkeleton() {
  return (
    <div className="flex gap-3 py-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-9 w-28 animate-pulse rounded-lg bg-[rgb(var(--color-bg-overlay))]" />
      ))}
    </div>
  )
}
