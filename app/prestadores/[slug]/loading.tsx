export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      <div className="mb-6 flex gap-4">
        <div className="h-20 w-20 rounded-2xl bg-ink-600/50" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-48 rounded bg-ink-600/50" />
          <div className="h-4 w-32 rounded bg-ink-600/40" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="h-40 rounded-xl bg-ink-700/40" />
          <div className="h-32 rounded-xl bg-ink-700/40" />
        </div>
        <div className="h-64 rounded-xl bg-ink-700/40" />
      </div>
    </div>
  );
}
