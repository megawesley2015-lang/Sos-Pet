import { TopBar } from "@/components/layout/TopBar";
import { GridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-ink-800">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <Skeleton className="mb-2 h-10 w-56" />
        <Skeleton className="mb-6 h-4 w-72" />
        <GridSkeleton count={3} />
      </main>
    </div>
  );
}
