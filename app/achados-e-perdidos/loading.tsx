// app/achados-e-perdidos/loading.tsx — loading automático do Next.js para a rota

import { PetGridSkeleton } from '@/components/skeletons/PetCardSkeleton'

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[rgb(var(--color-bg-overlay))]" />
          <div className="h-4 w-64 animate-pulse rounded bg-[rgb(var(--color-bg-overlay))]" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-full bg-[rgb(var(--color-bg-overlay))]" />
      </div>

      <div className="flex gap-3 py-4">
        {[32, 28, 36].map((_, i) => (
          <div key={i} className="h-9 w-28 animate-pulse rounded-lg bg-[rgb(var(--color-bg-overlay))]" />
        ))}
      </div>

      <PetGridSkeleton count={8} />
    </main>
  )
}
