import Link from "next/link";
import { UserRound } from "lucide-react";
import { getSessionWithProfile } from "@/lib/auth/session";
import { UserMenu } from "./UserMenu";
import { NavLinks } from "./NavLinks";
import { MobileNav } from "./MobileNav";

/**
 * TopBar — header das páginas de app (dark, backdrop blur).
 * Mesma estrutura do MarketingHeader mas sobre fundo escuro.
 * Usa NavLinks variant="dark" e MobileNav dark para consistência visual.
 */
export async function TopBar() {
  const { user, profile } = await getSessionWithProfile();

  const fullName = profile?.full_name ?? null;
  const avatarUrl = profile?.avatar_url ?? null;
  const role = profile?.role ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-900/80 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,133,27,0.08),0_4px_16px_rgba(0,0,0,0.2)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <img
            src="/logo.svg"
            alt="SOS Pet Aumigo — Achados e Perdidos"
            className="hidden h-12 w-auto sm:block"
          />
          <img
            src="/logo-icon.svg"
            alt="SOS Pet Aumigo"
            className="h-9 w-9 sm:hidden"
          />
        </Link>

        {/* Nav desktop — dark variant (xl+) */}
        <NavLinks variant="dark" />

        {/* Auth + Mobile */}
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <UserMenu
              email={user.email ?? ""}
              fullName={fullName}
              avatarUrl={avatarUrl}
              role={role}
            />
          ) : (
            <Link
              href="/login"
              className="hidden xl:flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm font-semibold text-fg-muted transition-all duration-150 hover:border-brand-400/50 hover:bg-white/10 hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <UserRound className="h-3.5 w-3.5" strokeWidth={2.5} />
              Entrar
            </Link>
          )}

          {/* Hamburguer — dark variant (< xl) */}
          <MobileNav isLoggedIn={!!user} isPrestador={role === "prestador"} dark />
        </div>
      </div>
    </header>
  );
}
