import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { PawPrint, Building2, Users, Handshake, Siren, Clock } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin — Visão Geral" };

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  // Defesa em profundidade — não confia somente no layout/middleware
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  // Métricas em paralelo — 1 round-trip por tabela, tudo em batch
  const [
    { count: totalPets },
    { count: petsLost },
    { count: petsFound },
    { count: totalProviders },
    { count: pendingProviders },
    { count: totalUsers },
    { count: totalParceiros },
    { count: pendingParceiros },
    { count: totalAlertas },
  ] = await Promise.all([
    supabase.from("pets").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("pets").select("*", { count: "exact", head: true }).eq("status", "active").eq("kind", "lost"),
    supabase.from("pets").select("*", { count: "exact", head: true }).eq("status", "active").eq("kind", "found"),
    supabase.from("prestadores").select("*", { count: "exact", head: true }),
    supabase.from("prestadores").select("*", { count: "exact", head: true }).eq("status", "pendente_aprovacao"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("parceiros").select("*", { count: "exact", head: true }),
    supabase.from("parceiros").select("*", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("alertas_sos").select("*", { count: "exact", head: true }),
  ]);

  const cards = [
    {
      label: "Pets ativos",
      value: totalPets ?? 0,
      sub: `${petsLost ?? 0} perdidos · ${petsFound ?? 0} encontrados`,
      icon: PawPrint,
      color: "text-brand-400",
      bg: "bg-brand-500/10 border-brand-500/20",
    },
    {
      label: "Prestadores",
      value: totalProviders ?? 0,
      sub: pendingProviders
        ? `${pendingProviders} aguardando aprovação`
        : "Nenhum pendente",
      icon: Building2,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      alert: (pendingProviders ?? 0) > 0,
    },
    {
      label: "Usuários cadastrados",
      value: totalUsers ?? 0,
      sub: "Tutores e prestadores",
      icon: Users,
      color: "text-fg-muted",
      bg: "bg-ink-600/40 border-white/10",
    },
    {
      label: "Parceiros",
      value: totalParceiros ?? 0,
      sub: pendingParceiros
        ? `${pendingParceiros} aguardando resposta`
        : "Nenhum pendente",
      icon: Handshake,
      color: "text-fg-muted",
      bg: "bg-ink-600/40 border-white/10",
      alert: (pendingParceiros ?? 0) > 0,
    },
    {
      label: "Alertas SOS disparados",
      value: totalAlertas ?? 0,
      sub: "Total histórico",
      icon: Siren,
      color: "text-brand-400",
      bg: "bg-brand-500/10 border-brand-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Visão geral</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Métricas em tempo real do SOS Pet.
        </p>
      </div>

      {/* Alertas pendentes */}
      {((pendingProviders ?? 0) > 0 || (pendingParceiros ?? 0) > 0) && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3">
          <Clock className="h-4 w-4 shrink-0 text-brand-400" />
          <p className="text-sm text-fg">
            {(pendingProviders ?? 0) > 0 && (
              <span>
                <strong>{pendingProviders}</strong> prestador(es) aguardando aprovação.{" "}
              </span>
            )}
            {(pendingParceiros ?? 0) > 0 && (
              <span>
                <strong>{pendingParceiros}</strong> parceiro(s) aguardando resposta.
              </span>
            )}
          </p>
        </div>
      )}

      {/* Cards de métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, sub, icon: Icon, color, bg, alert }) => (
          <div
            key={label}
            className={`relative rounded-xl border p-5 ${bg}`}
          >
            {alert && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-brand-500" />
            )}
            <Icon className={`mb-3 h-6 w-6 ${color}`} />
            <p className="font-display text-3xl font-bold text-fg">{value}</p>
            <p className="mt-0.5 text-sm font-medium text-fg">{label}</p>
            <p className="mt-1 text-xs text-fg-muted">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
