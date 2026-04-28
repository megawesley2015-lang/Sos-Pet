import Link from "next/link";
import { PawPrint, ArrowLeft, Search } from "lucide-react";

/**
 * 404 custom — substitui o padrão do Next.
 * Pode ser triggered por `notFound()` em qualquer rota ou URL não-existente.
 */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-800 bg-radial-brand px-4">
      <div className="bg-grid-subtle absolute inset-0 opacity-50" />
      <div className="relative w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-500 bg-brand-500/10 shadow-glow-brand-lg">
          <PawPrint
            className="h-10 w-10 text-brand-400"
            strokeWidth={2}
          />
        </div>

        <p className="font-display text-7xl font-black text-brand-500 glow-text-brand">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-fg">
          Não achamos esse pet
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          A página que você procurou pode ter sido removida, o link tá quebrado
          ou esse registro foi resolvido.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-fg hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar pra home
          </Link>
          <Link
            href="/pets"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow-brand hover:bg-brand-400"
          >
            <Search className="h-4 w-4" />
            Ver pets na rede
          </Link>
        </div>
      </div>
    </div>
  );
}
