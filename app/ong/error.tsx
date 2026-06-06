"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function OngError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ONG]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-fg">Algo deu errado</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Não foi possível carregar esta página do painel.
          {error.digest && (
            <span className="mt-1 block text-xs text-fg-subtle">
              Código: {error.digest}
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-ink-600 px-4 py-2 text-sm font-medium text-fg hover:bg-ink-500 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
        <Link
          href="/ong/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-fg-muted hover:text-fg transition-colors"
        >
          Ir ao dashboard
        </Link>
      </div>
    </div>
  );
}
