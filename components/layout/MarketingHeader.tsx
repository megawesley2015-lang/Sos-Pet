import Link from "next/link";
import { PawPrint, Search } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";

/**
 * Header das páginas públicas (light-warm).
 * Mais "site" do que "app" — links de navegação + CTA de entrar.
 *
 * Logado   → UserMenu dropdown (mesmo componente da TopBar)
 * Deslogado → "Entrar" + "Criar conta"
 * Mobile   → MobileNav hamburguer com drawer
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
    <header className="sticky top-0 z-40 border-b border-warm-200/80 bg-warm-50/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-500 bg-brand-100 shadow-glow-brand">
            <PawPrint className="h-4 w-4 text-brand-600" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold text-ink-900">
              SOS <span className="text-brand-500">Pet</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-brand-700/70">
              Achados &amp; Perdidos
            </span>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/pets"
            className="text-sm font-medium text-ink-800 transition-colors hover:text-brand-600"
          >
            Achados
          </Link>
          <Link
            href="/prestadores"
            className="text-sm font-medium text-ink-800 transition-colors hover:text-brand-600"
          >
            Prestadores
          </Link>
          <Link
            href="/dicas"
            className="text-sm font-medium text-ink-800 transition-colors hover:text-brand-600"
          >
            Dicas
          </Link>
          <Link
            href="/parcerias"
            className="text-sm font-medium text-ink-800 transition-colors hover:text-brand-600"
          >
            Parcerias
          </Link>
          <Link
            href="/loja"
            className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            🛍️ Loja
          </Link>
        </nav>

        {/* Ações desktop + mobile */}
        <div className="flex items-center gap-2">
          {/* Busca rápida — só mobile (em vez de sumir tudo) */}
          <Link
            href="/pets"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-warm-200 bg-warm-100/60 text-ink-700 transition-colors hover:bg-warm-200/60 sm:hidden"
            aria-label="Buscar pets"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* Auth — desktop */}
          <div className="hidden sm:flex sm:items-center sm:gap-2">
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
                  className="text-sm font-bold text-ink-800 hover:text-brand-600"
                >
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  className="rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>

          {/* Hamburguer mobile */}
          <MobileNav isLoggedIn={!!user} />
        </div>
      </div>
    </header>
  );
}
