// app/achados-e-perdidos/page.tsx
// Server Component — SSR de metadados + filtros via URL.
// PetListClient (filho) gerencia cursor pagination client-side.

import { Suspense }          from 'react'
import Link                  from 'next/link'
import { FilterBar }         from '@/components/pets/FilterBar'
import { PetGridSkeleton }   from '@/components/skeletons/PetCardSkeleton'
import { PetListClient }     from '@/components/pets/PetListClient'

// ── Page ──────────────────────────────────────────────────────────────────
// Next.js 15+: searchParams é Promise
interface PageProps {
  searchParams: Promise<{
    kind?: string; species?: string; city?: string
    color?: string; size?: string; neighborhood?: string
    lat?: string; lng?: string; radiusKm?: string
  }>
}

export const metadata = {
  title:       'Achados e Perdidos — SOS Pet',
  description: 'Pets perdidos e encontrados na sua região. Cadastre um alerta grátis.',
}

export default async function AchadosEPerdidosPage({ searchParams }: PageProps) {
  const sp = await searchParams

  // Chave que muda com qualquer filtro → força re-exibição do skeleton
  const filterKey = [
    sp.kind, sp.species, sp.city,
    sp.color, sp.size, sp.neighborhood,
    sp.lat, sp.lng, sp.radiusKm,
  ].join('|')

  return (
    <div data-theme="light" className="min-h-screen bg-bg">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-fg">
              Achados <span className="text-brand-500">&</span> Perdidos
            </h1>
            <p className="mt-1 text-sm text-fg-muted">Pets perdidos e encontrados na sua região</p>
          </div>

          <Link
            href="/achados-e-perdidos/cadastrar"
            className="
              inline-flex items-center gap-2 rounded-full
              bg-[rgb(var(--color-primary))] text-white
              px-6 py-3 text-sm font-semibold
              shadow-[0_0_20px_rgba(255,133,27,0.3)]
              hover:bg-[rgb(var(--color-primary))]/90
              transition-all duration-200
              focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-[rgb(var(--color-primary))]
            "
          >
            🐾 Cadastrar alerta
          </Link>
        </div>

        {/* Filtros — client component, muda URL → server re-render */}
        <Suspense fallback={<FilterBarSkeleton />}>
          <FilterBar />
        </Suspense>

        {/* Lista com cursor pagination — key muda quando filtro muda → remonta o Client Component */}
        <Suspense
          key={filterKey}
          fallback={<PetGridSkeleton count={8} />}
        >
          <PetListClient />
        </Suspense>
      </main>
    </div>
  )
}

function FilterBarSkeleton() {
  return (
    <div className="flex gap-3 py-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-9 w-28 animate-pulse rounded-lg bg-bg-overlay" />
      ))}
    </div>
  )
}
