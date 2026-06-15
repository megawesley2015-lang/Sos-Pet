import Link from "next/link";
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
    <div className="min-h-screen bg-bg bg-radial-brand">
      <div className="bg-grid-subtle flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-6 flex items-center justify-center">
            <img
              src="/logo-dark.svg"
              alt="SOS Pet Aumigo — Achados e Perdidos"
              className="h-14 w-auto"
            />
          </Link>

          <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-warm-card sm:p-8">
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
