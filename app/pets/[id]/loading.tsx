export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-8">
      <div className="mb-6 h-4 w-40 rounded bg-ink-600/50" />
      <div className="aspect-[4/3] w-full rounded-2xl bg-ink-700/50" />
      <div className="mt-6 space-y-4">
        <div className="h-8 w-64 rounded bg-ink-600/50" />
        <div className="flex gap-2">
          {[80, 64, 72].map((w, i) => (
            <div key={i} className="h-6 rounded-full bg-ink-600/50" style={{ width: w }} />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-ink-600/40" />
          <div className="h-4 w-5/6 rounded bg-ink-600/40" />
          <div className="h-4 w-4/6 rounded bg-ink-600/40" />
        </div>
        <div className="h-12 w-full rounded-full bg-ink-600/50" />
      </div>
    </div>
  );
}
