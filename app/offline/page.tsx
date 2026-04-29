import Link from "next/link";
import { WifiOff, PawPrint, RefreshCw } from "lucide-react";

export const metadata = {
  title: "Você está offline · SOS Pet",
};

/**
 * Página de fallback para o Service Worker quando não há conexão.
 * O SW precacheia esta rota em PRECACHE_URLS do public/sw.js.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-900 px-4 text-center text-fg">
      {/* Ícone */}
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-brand-500/30 bg-brand-500/10">
          <PawPrint className="h-10 w-10 text-brand-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink-800 border-2 border-ink-700">
          <WifiOff className="h-3.5 w-3.5 text-fg-subtle" />
        </div>
      </div>

      <h1 className="font-display text-2xl font-black text-fg">Você está offline</h1>
      <p className="mt-3 max-w-sm text-sm text-fg-muted">
        Parece que a conexão caiu. Algumas páginas podem estar disponíveis no cache — tente navegar pelo menu.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-400"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm text-fg-muted hover:bg-white/5"
        >
          Ir para home
        </Link>
      </div>

      <p className="mt-10 text-xs text-fg-subtle">
        SOS Pet · Rede colaborativa de resgate de animais
      </p>
    </div>
  );
}
