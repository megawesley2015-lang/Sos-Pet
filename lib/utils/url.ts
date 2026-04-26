/**
 * getBaseUrl — URL canônica do app, válida em dev/preview/prod.
 *
 * Resolução:
 *   1. window.location.origin   (client)
 *   2. NEXT_PUBLIC_SITE_URL     (server, prod)
 *   3. VERCEL_URL               (server, preview deploys da Vercel)
 *   4. http://localhost:3000    (server, dev local)
 *
 * Usar como `emailRedirectTo` em todas as ações de auth (signUp, resetPassword)
 * pra evitar links de confirmação quebrados entre ambientes.
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function authCallbackUrl(redirectTo?: string): string {
  const base = getBaseUrl();
  const next = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : "";
  return `${base}/auth/callback${next}`;
}
