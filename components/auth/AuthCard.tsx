import Link from "next/link";
import { PawPrint } from "lucide-react";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Card centralizado das telas de auth — dark + glow brand.
 */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-ink-800 bg-radial-brand">
      <div className="bg-grid-subtle flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-6 flex items-center justify-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-500 bg-brand-500/15 shadow-glow-brand">
              <PawPrint className="h-5 w-5 text-brand-400" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl font-bold text-fg">
                SOS{" "}
                <span className="text-brand-500 glow-text-brand">Pet</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-fg-subtle">
                Achados &amp; Perdidos
              </span>
            </div>
          </Link>

          <div className="rounded-2xl border border-white/10 bg-ink-700/80 p-6 backdrop-blur-sm sm:p-8">
            <h1 className="font-display text-2xl font-bold text-fg">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
            )}

            <div className="mt-6">{children}</div>
          </div>

          {footer && (
            <div className="mt-4 text-center text-sm text-fg-muted">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
