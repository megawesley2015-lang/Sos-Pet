import Link from "next/link";
import { UserRound } from "lucide-react";
import { getSessionWithProfile } from "@/lib/auth/session";
import { UserMenu } from "./UserMenu";
import { NavLinks } from "./NavLinks";
import { MobileNav } from "./MobileNav";
import { Search } from "lucide-react";

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
          {/* Busca rápida — mobile/tablet */}
          <Link
            href="/pets"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-fg-muted transition-all duration-150 hover:border-brand-400/50 hover:bg-white/10 hover:text-brand-300 xl:hidden"
            aria-label="Buscar pets"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* Auth desktop (xl+) */}
          <div className="hidden xl:flex xl:items-center xl:gap-2.5">
            {role !== "prestador" && (
              <>
                <Link
                  href="/para-prestadores"
                  className="rounded-full border border-accent/40 px-3.5 py-1.5 text-xs font-semibold text-accent-text transition-all duration-150 hover:border-accent hover:bg-accent/5 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  Anuncie seu serviço
                </Link>
                <span className="h-5 w-px bg-white/15" aria-hidden />
              </>
            )}
            {user ? (
              <UserMenu
                email={user.email ?? ""}
                fullName={fullName}
                avatarUrl={avatarUrl}
                role={role}
              />
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm font-semibold text-fg-muted transition-all duration-150 hover:border-brand-400/50 hover:bg-white/10 hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  <UserRound className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  className="rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-brand-400 hover:shadow-glow-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>

          {/* Hamburguer (< xl) */}
          <MobileNav isLoggedIn={!!user} isPrestador={role === "prestador"} dark />
        </div>
      </div>
    </header>
  );
}
