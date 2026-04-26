import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Plus, TrendingUp } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { CTAButton } from "@/components/ui/CTAButton";
import { PrestadorDashboardCard } from "@/components/providers/PrestadorDashboardCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { listProviders } from "@/lib/services/providers";
import type { PrestadorStatsRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPrestadorPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) {
    redirect("/login?next=/dashboard-prestador");
  }

  const { providers } = await listProviders({ ownerId: user.id, limit: 50 });

  // Stats em batch — 1 query única
  let statsByProvider: Record<string, PrestadorStatsRow> = {};
  if (providers.length > 0) {
    const { data: statsRowsRaw } = await supabase
      .from("prestador_stats")
      .select("*")
      .in(
        "prestador_id",
        providers.map((p) => p.id)
      );
    const statsRows = (statsRowsRaw as PrestadorStatsRow[] | null) ?? [];
    statsByProvider = Object.fromEntries(
      statsRows.map((s) => [s.prestador_id, s])
    );
  }

  // Totais agregados (cabeçalho)
  const totalViews = Object.values(statsByProvider).reduce(
    (acc, s) => acc + s.visualizacoes,
    0
  );
  const totalWhatsapp = Object.values(statsByProvider).reduce(
    (acc, s) => acc + s.cliques_whatsapp,
    0
  );
  const totalReviews = providers.reduce((acc, p) => acc + p.total_avaliacoes, 0);

  return (
    <div className="min-h-screen bg-ink-800 bg-radial-brand">
      <div className="bg-grid-subtle min-h-screen">
        <TopBar />

        <main className="mx-auto max-w-5xl px-4 pb-20 pt-6">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight">
                Painel do{" "}
                <span className="text-cyan-400 glow-text-brand">prestador</span>
              </h1>
              <p className="mt-1 text-sm text-fg-muted">
                Suas métricas e gestão dos seus estabelecimentos.
              </p>
            </div>

            <CTAButton
              href="/prestadores/novo"
              variant="secondary"
              icon={<Plus className="h-4 w-4" strokeWidth={3} />}
            >
              Novo prestador
            </CTAButton>
          </header>

          {providers.length === 0 ? (
            <Empty />
          ) : (
            <>
              {/* Resumo geral */}
              <section className="mb-6 grid gap-3 sm:grid-cols-3">
                <SummaryStat
                  label="Estabelecimentos"
                  value={providers.length}
                />
                <SummaryStat label="Visualizações totais" value={totalViews} />
                <SummaryStat
                  label="Cliques WhatsApp totais"
                  value={totalWhatsapp}
                />
              </section>

              {totalReviews > 0 && (
                <p className="mb-4 inline-flex items-center gap-1.5 text-xs text-fg-muted">
                  <TrendingUp className="h-3 w-3 text-cyan-400" />
                  {totalReviews}{" "}
                  {totalReviews === 1 ? "avaliação recebida" : "avaliações recebidas"} no total
                </p>
              )}

              {/* Lista de prestadores com métricas */}
              <ul className="space-y-4">
                {providers.map((p) => (
                  <li key={p.id}>
                    <PrestadorDashboardCard
                      prestador={p}
                      stats={statsByProvider[p.id] ?? null}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-700/50 p-4">
      <p className="font-display text-3xl font-bold text-fg">
        {value.toLocaleString("pt-BR")}
      </p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-fg-subtle">
        {label}
      </p>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-ink-700/40 p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-500/40 bg-cyan-500/10">
        <Building2 className="h-7 w-7 text-cyan-400" strokeWidth={2} />
      </div>
      <h2 className="font-display text-xl font-bold text-fg">
        Você ainda não tem prestadores cadastrados
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-fg-muted">
        Cadastre seu estabelecimento e apareça pra quem precisa de cuidado pro
        pet.
      </p>
      <div className="mt-5">
        <CTAButton
          href="/prestadores/novo"
          variant="primary"
          icon={<Plus className="h-4 w-4" strokeWidth={3} />}
        >
          Cadastrar prestador
        </CTAButton>
      </div>
      <Link
        href="/prestadores"
        className="mt-3 inline-block text-xs text-fg-subtle hover:text-fg-muted"
      >
        ou explore quem já está na rede
      </Link>
    </div>
  );
}
