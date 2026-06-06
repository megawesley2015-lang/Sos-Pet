// components/skeletons/PetCardSkeleton.tsx — mesmas dimensões do PetCard (evita CLS)

export function PetCardSkeleton() {
  return (
    <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-raised))] overflow-hidden" aria-hidden="true">
      <div className="aspect-[4/3] w-full animate-pulse bg-[rgb(var(--color-bg-overlay))]" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-5 w-20 animate-pulse rounded-full bg-[rgb(var(--color-bg-overlay))]" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-[rgb(var(--color-bg-overlay))]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[rgb(var(--color-bg-overlay))]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[rgb(var(--color-bg-overlay))]" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-[rgb(var(--color-bg-overlay))]" />
      </div>
    </div>
  )
}

export function PetGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="list"
      aria-label="Carregando alertas..."
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}><PetCardSkeleton /></li>
      ))}
    </ul>
  )
}

export function PetDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="aspect-[16/9] w-full animate-pulse rounded-2xl bg-[rgb(var(--color-bg-overlay))]" />
      <div className="flex items-center gap-3">
        <div className="h-6 w-24 animate-pulse rounded-full bg-[rgb(var(--color-bg-overlay))]" />
        <div className="h-4 w-32 animate-pulse rounded bg-[rgb(var(--color-bg-overlay))]" />
      </div>
      <div className="h-8 w-2/3 animate-pulse rounded bg-[rgb(var(--color-bg-overlay))]" />
      <div className="flex flex-col gap-2">
        <div className="h-3 w-full animate-pulse rounded bg-[rgb(var(--color-bg-overlay))]" />
        <div className="h-3 w-full animate-pulse rounded bg-[rgb(var(--color-bg-overlay))]" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-[rgb(var(--color-bg-overlay))]" />
      </div>
      <div className="h-12 w-full animate-pulse rounded-full bg-[rgb(var(--color-bg-overlay))]" />
    </div>
  )
}
