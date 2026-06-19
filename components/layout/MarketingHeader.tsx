import Link from "next/link";
import { Search } from "lucide-react";
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
        <Link href="/" className="flex items-center">
          {/* Versão completa — desktop */}
          <img
            src="/logo.svg"
            alt="SOS Pet Aumigo — Achados e Perdidos"
            className="hidden h-14 w-auto sm:block"
          />
          {/* Só ícone — mobile */}
          <img
            src="/logo-icon.svg"
            alt="SOS Pet Aumigo"
            className="h-10 w-10 sm:hidden"
          />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-6 lg:flex">
          {[
            { href: "/pets",         label: "Achados" },
            { href: "/adotar",       label: "❤️ Adoção" },
            { href: "/mapa",         label: "Mapa" },
            { href: "/avistamentos", label: "Avistamentos" },
            { href: "/prestadores",  label: "Prestadores" },
            { href: "/dicas",        label: "Dicas" },
            { href: "/sentinela",    label: "📷 Sentinela" },
            { href: "/loja",         label: "🛍️ Loja" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="relative text-sm font-medium text-fg-muted transition-colors duration-150 hover:text-brand-600
                after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-brand-500
                after:transition-[width] after:duration-200 hover:after:w-full"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Ações desktop + mobile */}
        <div className="flex items-center gap-2">
          {/* Busca rápida — só mobile (em vez de sumir tudo) */}
          <Link
            href="/pets"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-warm-200 bg-warm-100/60 text-fg-muted transition-colors hover:bg-warm-200/60 lg:hidden"
            aria-label="Buscar pets"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* Auth — desktop */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            {role !== "prestador" && (
              <>
                <Link
                  href="/para-prestadores"
                  className="text-sm font-semibold text-fg-muted transition-colors hover:text-accent"
                >
                  Anuncie seu serviço
                </Link>
                <span className="h-5 w-px bg-warm-200" aria-hidden />
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
                  className="text-sm font-semibold text-fg-muted transition-colors hover:text-brand-600"
                >
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  className="rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-400 hover:shadow-glow-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>

          {/* Hamburguer mobile */}
          <MobileNav isLoggedIn={!!user} isPrestador={role === "prestador"} />
        </div>
      </div>
    </header>
  );
}
