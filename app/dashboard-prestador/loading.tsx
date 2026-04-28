import { TopBar } from "@/components/layout/TopBar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-ink-800">
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6">
        <Skeleton className="mb-2 h-10 w-72" />
        <Skeleton className="mb-6 h-4 w-96" />
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
