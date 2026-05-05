import Link from "next/link";
import { PawPrint, UserRound } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { getMyProfile } from "@/lib/services/profiles";
import { UserMenu } from "./UserMenu";

/**
 * TopBar — header das páginas de app (dark theme).
 * Inclui logo + links de navegação + UserMenu (logado) ou botão Entrar.
 *
 * Server Component: sem flash de estado não-autenticado durante hydration.
 * Usa getMyProfile() com React.cache — sem query de profile duplicada por request.
 */
export async function TopBar() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  const profile = user ? await getMyProfile() : null;
  const fullName = profile?.full_name ?? null;
  const avatarUrl = profile?.avatar_url ?? null;
  const role = profile?.role ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-brand-500/20 bg-ink-900/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-500 bg-brand-500/15 shadow-glow-brand">
            <PawPrint className="h-4 w-4 text-brand-400" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold text-fg">
              SOS <span className="text-brand-500 glow-text-brand">Pet</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-fg-subtle">
              Achados &amp; Perdidos
            </span>
          </div>
        </Link>

        {/* Nav — links principais (desktop) */}
        <nav className="hidden items-center gap-5 sm:flex">
          <Link
            href="/pets"
            className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
          >
            Achados
          </Link>
          <Link
            href="/prestadores"
            className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
          >
            Prestadores
          </Link>
          <Link
            href="/loja"
            className="text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
          >
            🛍️ Loja
          </Link>
        </nav>

        {/* Auth */}
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
            aria-label="Entrar"
            className="flex h-9 items-center gap-1.5 rounded-full border-2 border-cyan-500/60 bg-ink-600 px-3 text-xs font-bold text-cyan-300 shadow-glow-cyan transition-all hover:bg-cyan-500/10"
          >
            <UserRound className="h-3.5 w-3.5" strokeWidth={2.5} />
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
