import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import {
  LayoutDashboard,
  PawPrint,
  Heart,
  ArrowLeft,
  Building2,
  FileText,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";

/**
 * Layout do painel ONG / Protetor.
 *
 * Guard:
 * 1. Usuário autenticado.
 * 2. Tem ao menos um shelter cadastrado → redireciona pro cadastro se não.
 *    Exceção: se o pathname já é /ong/cadastro, deixa passar (evita loop).
 *
 * ATENÇÃO: typeof window === 'undefined' sempre é true em Server Components.
 * Usar headers().get('x-invoke-path') ou next-url para ler o pathname no servidor.
 */
export default async function OngLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    redirect("/login?next=/ong/dashboard");
  }

  // Lê o pathname atual via headers (Next.js injeta x-pathname no middleware)
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-invoke-path") ?? "";
  const isOnCadastro = pathname.includes("/ong/cadastro");

  // Verifica se o usuário já tem um shelter cadastrado
  const { data: shelter } = await supabase
    .from("shelters")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  // Sem shelter → redireciona pro cadastro (exceto se já está lá)
  if (!shelter && !isOnCadastro) {
    redirect("/ong/cadastro");
  }

  const navItems = [
    { href: "/ong/dashboard",   label: "Visão geral",  icon: LayoutDashboard },
    { href: "/ong/pets",        label: "Pets",          icon: PawPrint },
    { href: "/ong/prontuarios", label: "Prontuários",   icon: FileText },
    { href: "/ong/adocoes",     label: "Adoções",       icon: Heart },
    { href: "/ong/cadastro",    label: "Minha ONG",     icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-ink-800">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-cyan-400" />
            <span className="font-display text-sm font-bold tracking-wide text-fg">
              {shelter?.name ?? "Painel ONG"}
            </span>
          </div>
          <span className="ml-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-300">
            ONG
          </span>
          <span className="ml-auto text-xs text-fg-subtle">{user.email}</span>
          <Link
            href="/"
            className="ml-4 flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar ao site
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
