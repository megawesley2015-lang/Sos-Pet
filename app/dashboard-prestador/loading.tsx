import { TopBar } from "@/components/layout/TopBar";

export default function Loading() {
  return (
    <div className="min-h-screen bg-bg" data-theme="light">
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6">
        <div className="animate-pulse">
          <div className="mb-2 h-10 w-72 max-w-full rounded-lg bg-warm-200" />
          <div className="mb-6 h-4 w-96 max-w-full rounded bg-warm-200/70" />
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl border border-warm-200 bg-white shadow-warm-card"
              />
            ))}
          </div>
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-warm-200 bg-white shadow-warm-card"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
