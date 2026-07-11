import { TopBar } from "@/components/layout/TopBar";

export default function Loading() {
  return (
    <div className="min-h-screen bg-bg" data-theme="light">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <div className="animate-pulse">
          <div className="mb-2 h-10 w-80 max-w-full rounded-lg bg-warm-200" />
          <div className="mb-6 h-4 w-56 max-w-full rounded bg-warm-200/70" />
          <div className="mb-6 h-16 w-full rounded-xl bg-warm-100" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-2xl border border-warm-200 bg-white p-3 shadow-warm-card"
              >
                <div className="h-32 w-full rounded-lg bg-warm-200" />
                <div className="h-4 w-2/3 rounded bg-warm-200" />
                <div className="h-3 w-1/2 rounded bg-warm-200/70" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
