import { cn } from "@/lib/utils/cn";

/**
 * Skeleton genérico — placeholder animado pra loading states.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-white/5",
        className
      )}
      {...props}
    />
  );
}

/**
 * Card-shaped skeleton — usado nas listagens de pets/prestadores.
 */
export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-ink-700/40 p-3">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
