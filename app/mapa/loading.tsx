export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ink-900">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-brand-500" />
        <p className="text-sm text-fg-muted">Carregando mapa…</p>
      </div>
    </div>
  );
}
