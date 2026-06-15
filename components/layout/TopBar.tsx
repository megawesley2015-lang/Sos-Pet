import Link from "next/link";
import { UserRound } from "lucide-react";
import { getSessionWithProfile } from "@/lib/auth/session";
import { UserMenu } from "./UserMenu";

export async function TopBar() {
  // getSessionWithProfile é cacheada por React.cache:
  // se chamada múltiplas vezes no mesmo request, executa apenas uma vez.
  const { user, profile } = await getSessionWithProfile();

  const fullName = profile?.full_name ?? null;
  const avatarUrl = profile?.avatar_url ?? null;
  const role = profile?.role ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-brand-500/20 bg-ink-900/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center">
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
        <nav className="hidden items-center gap-5 sm:flex">
          <Link href="/pets" className="text-sm font-medium text-fg-muted transition-colors hover:text-fg">
            Achados
          </Link>
          <Link href="/mapa" className="text-sm font-medium text-fg-muted transition-colors hover:text-fg">
            Mapa
          </Link>
          <Link href="/avistamentos" className="text-sm font-medium text-fg-muted transition-colors hover:text-fg">
            Avistamentos
          </Link>
          <Link href="/prestadores" className="text-sm font-medium text-fg-muted transition-colors hover:text-fg">
            Prestadores
          </Link>
          <Link href="/dicas" className="text-sm font-medium text-fg-muted transition-colors hover:text-fg">
            Dicas
          </Link>
          <Link href="/sentinela" className="text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300">
            Sentinela
          </Link>
          <Link href="/loja" className="text-sm font-medium text-brand-400 transition-colors hover:text-brand-300">
            Loja
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
            className="flex h-9 items-center gap-1.5 rounded-full border-2 border-brand-500 bg-brand-500/10 px-3 text-xs font-bold text-brand-600 transition-all hover:bg-brand-500/20 dark:border-cyan-500/60 dark:bg-ink-600 dark:text-cyan-300 dark:shadow-glow-cyan dark:hover:bg-cyan-500/10"
          >
            <UserRound className="h-3.5 w-3.5" strokeWidth={2.5} />
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
