"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary do app — captura crashes em qualquer rota não-marketing.
 * Layout simples (não usa TopBar pra evitar erro recursivo).
 */
export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[app:error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-800 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-danger/40 bg-danger/10">
          <AlertTriangle className="h-7 w-7 text-danger-fg" />
        </div>
        <h1 className="font-display text-2xl font-bold text-fg">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          Tivemos um problema inesperado. Tenta de novo — se persistir, volta
          pra home.
        </p>
        {error.digest && (
          <p className="mt-3 text-[11px] text-fg-subtle">
            Código: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-fg hover:bg-white/10"
          >
            <Home className="h-4 w-4" />
            Voltar pra home
          </Link>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow-brand hover:bg-brand-400"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar de novo
          </button>
        </div>
      </div>
    </div>
  );
}
