import { TopBar } from "@/components/layout/TopBar";
import { GridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-ink-800">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <Skeleton className="mb-2 h-10 w-80" />
        <Skeleton className="mb-6 h-4 w-56" />
        <Skeleton className="mb-6 h-32 w-full" />
        <GridSkeleton count={6} />
      </main>
    </div>
  );
}
