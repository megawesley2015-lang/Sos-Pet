import { redirect } from "next/navigation";
import Link from "next/link";
import { HeartHandshake, PawPrint, ClipboardList, Users, LayoutDashboard, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";

export default async function OngLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login?next=/ong");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  // Acesso: role ong ou admin
  if (profile?.role !== "ong" && profile?.role !== "admin") {
    redirect("/");
  }

  const nav = [
    { href: "/ong",          label: "Visão Geral",  icon: LayoutDashboard },
    { href: "/ong/pets",     label: "Pets Resgatados", icon: PawPrint },
    { href: "/ong/prontuarios", label: "Prontuários", icon: ClipboardList },
    { href: "/ong/adocoes",  label: "Adoções",      icon: Users },
  ];

  return (
    <div className="min-h-screen bg-ink-800">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <HeartHandshake className="h-5 w-5 text-cyan-400" />
          <span className="font-display text-sm font-bold text-fg">
            Painel ONG — SOS Pet
          </span>
          <span className="ml-auto text-xs text-fg-subtle">
            {profile?.full_name ?? user.email}
          </span>
          {profile?.role === "admin" && (
            <Link href="/admin" className="ml-2 text-xs text-fg-muted hover:text-fg">
              Admin →
            </Link>
          )}
          <Link href="/" className="ml-2 text-xs text-fg-muted hover:text-fg">
            ← Site
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="hidden w-52 shrink-0 md:block">
          <nav className="sticky top-20 space-y-1">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-ink-700 hover:text-fg"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <div className="my-2 border-t border-white/10" />
            <Link
              href="/ong/cadastro"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-ink-700 hover:text-fg"
            >
              <ShieldCheck className="h-4 w-4" />
              Dados da ONG
            </Link>
          </nav>
        </aside>

        {/* Conteúdo */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
