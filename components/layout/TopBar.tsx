import Link from "next/link";
import { PawPrint, UserRound } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { UserMenu } from "./UserMenu";

/**
 * TopBar — Server Component.
 *
 * Lê a sessão direto via supabase server client. Se logado, renderiza UserMenu
 * (client component). Se deslogado, mostra link "Entrar".
 *
 * Por que Server Component: evita flash de estado deslogado durante hydration.
 */
export async function TopBar() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  let fullName: string | null = null;
  let avatarUrl: string | null = null;

  if (user) {
    const { data: profileRaw } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    const profile = profileRaw as
      | { full_name: string | null; avatar_url: string | null }
      | null;
    fullName = profile?.full_name ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-500/20 bg-ink-900/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
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

        {user ? (
          <UserMenu
            email={user.email ?? ""}
            fullName={fullName}
            avatarUrl={avatarUrl}
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
