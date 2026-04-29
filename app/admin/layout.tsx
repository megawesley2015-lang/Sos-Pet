import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Building2, Handshake, PawPrint, ShieldCheck, Eye, QrCode, ShoppingBag } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";

/**
 * Layout do painel admin.
 *
 * Guard duplo:
 * 1. Usuário deve estar autenticado.
 * 2. profiles.role deve ser 'admin'.
 *
 * Qualquer acesso sem essas condições redireciona pro login ou home.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const navItems = [
    { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
    { href: "/admin/prestadores", label: "Prestadores", icon: Building2 },
    { href: "/admin/parceiros", label: "Parceiros", icon: Handshake },
    { href: "/admin/pets", label: "Pets", icon: PawPrint },
    { href: "/admin/avistamentos", label: "Avistamentos", icon: Eye },
    { href: "/admin/plaquinhas", label: "Plaquinhas", icon: QrCode },
    { href: "/admin/loja", label: "Loja", icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-ink-800">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <ShieldCheck className="h-5 w-5 text-brand-500" />
          <span className="font-display text-sm font-bold tracking-wide text-fg">
            Admin — SOS Pet
          </span>
          <span className="ml-auto text-xs text-fg-subtle">
            {user.email}
          </span>
          <Link
            href="/"
            className="ml-4 text-xs text-fg-muted hover:text-fg"
          >
            ← Sair do admin
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="sticky top-20 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-ink-700 hover:text-fg"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Conteúdo */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
