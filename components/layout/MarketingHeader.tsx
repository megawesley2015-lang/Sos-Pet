import Link from "next/link";
import { Search } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";

/**
 * Header das páginas públicas.
 * Logado   → UserMenu dropdown
 * Deslogado → "Entrar" ghost pill + "Criar conta" amber pill
 * Mobile   → MobileNav hamburguer com drawer (xl:hidden)
 */
export async function MarketingHeader() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  let fullName: string | null = null;
  let avatarUrl: string | null = null;
  let role: string | null = null;

  if (user) {
    const { data: profileRaw } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, role")
      .eq("id", user.id)
      .maybeSingle();
    const profile = profileRaw as
      | { full_name: string | null; avatar_url: string | null; role: string | null }
      | null;
    fullName = profile?.full_name ?? null;
    avatarUrl = profile?.avatar_url ?? null;
    role = profile?.role ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-warm-200/60 bg-white/92 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,133,27,0.10),0_4px_16px_rgba(26,18,8,0.04)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <img
            src="/logo.svg"
            alt="SOS Pet Aumigo — Achados e Perdidos"
            width={120}
            height={56}
            className="hidden h-12 w-auto sm:block"
          />
          <img
            src="/logo-icon.svg"
            alt="SOS Pet Aumigo"
            width={36}
            height={36}
            className="h-9 w-9 sm:hidden"
          />
        </Link>

        {/* Nav desktop — pill container com active state (xl+) */}
        <NavLinks />

        {/* Ações desktop + mobile */}
        <div className="flex shrink-0 items-center gap-2">

          {/* Busca rápida — mobile/tablet */}
          <Link
            href="/pets"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-warm-200/80 bg-warm-100/60 text-fg-muted transition-all duration-150 hover:border-brand-300 hover:bg-warm-200/60 hover:text-brand-600 xl:hidden"
            aria-label="Buscar pets"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* Auth — desktop (xl+) */}
          <div className="hidden xl:flex xl:items-center xl:gap-2.5">
            {role !== "prestador" && (
              <>
                <Link
                  href="/para-prestadores"
                  className="rounded-full border border-accent/40 px-3.5 py-1.5 text-xs font-semibold text-accent-text transition-all duration-150 hover:border-accent hover:bg-accent/5 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  Anuncie seu serviço
                </Link>
                <span className="h-5 w-px bg-warm-200/80" aria-hidden />
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
                  className="rounded-full border border-warm-300/80 px-4 py-1.5 text-sm font-semibold text-fg-muted transition-all duration-150 hover:border-brand-300/70 hover:bg-warm-100/70 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
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

          {/* Hamburguer — mobile/tablet */}
          <MobileNav isLoggedIn={!!user} isPrestador={role === "prestador"} />
        </div>
      </div>
    </header>
  );
}
