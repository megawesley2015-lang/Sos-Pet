import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PawPrint, ClipboardList, Users, Heart, AlertTriangle, Clock } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel ONG — SOS Pet" };

export default async function OngDashboard() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  // Métricas em paralelo
  const [
    { count: totalPets },
    { count: emAdocao },
    { count: adotados },
    { count: medicacoesAtivas },
    { count: vacinasProximas },
  ] = await Promise.all([
    supabase
      .from("prontuarios")
      .select("*", { count: "exact", head: true })
      .eq("ong_id", user.id),
    supabase
      .from("pets")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("status", "active"),
    supabase
      .from("adocoes")
      .select("*", { count: "exact", head: true })
      .eq("ong_id", user.id)
      .eq("status", "ativo"),
    supabase
      .from("medicacoes")
      .select("*", { count: "exact", head: true })
      .eq("ativa", true)
      .in(
        "prontuario_id",
        (
          await supabase
            .from("prontuarios")
            .select("id")
            .eq("ong_id", user.id)
        ).data?.map((p) => p.id) ?? []
      ),
    // Vacinas com próxima dose nos próximos 30 dias
    supabase
      .from("vacinas")
      .select("*", { count: "exact", head: true })
      .gte("proxima_dose", new Date().toISOString().slice(0, 10))
      .lte(
        "proxima_dose",
        new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10)
      )
      .in(
        "prontuario_id",
        (
          await supabase
            .from("prontuarios")
            .select("id")
            .eq("ong_id", user.id)
        ).data?.map((p) => p.id) ?? []
      ),
  ]);

  // Últimos prontuários
  const { data: recentes } = await supabase
    .from("prontuarios")
    .select("id, data_resgate, situacao_saude, pet_id, pets(name, species, photo_url)")
    .eq("ong_id", user.id)
    .order("data_resgate", { ascending: false })
    .limit(5);

  // Adoções aguardando acompanhamento
  const hoje = new Date();
  const { data: pendentesAcomp } = await supabase
    .from("adocoes")
    .select("id, adotante_nome, pet_id, data_adocao, acompanhamento_30d, acompanhamento_90d")
    .eq("ong_id", user.id)
    .eq("status", "ativo")
    .or("acompanhamento_30d.eq.false,acompanhamento_90d.eq.false")
    .limit(5);

  const SAUDE_COLOR: Record<string, string> = {
    critica:   "text-danger bg-danger/10 border-danger/30",
    regular:   "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    boa:       "text-green-400 bg-green-400/10 border-green-400/30",
    excelente: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  };
  const SAUDE_LABEL: Record<string, string> = {
    critica: "Crítica", regular: "Regular", boa: "Boa", excelente: "Excelente",
  };
  const SPECIES: Record<string, string> = { dog: "🐕", cat: "🐈", other: "🐾" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Visão Geral</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Métricas em tempo real do seu abrigo.
        </p>
      </div>

      {/* Alertas */}
      {(vacinasProximas ?? 0) > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400" />
          <p className="text-sm text-fg">
            <strong>{vacinasProximas}</strong> vacina(s) com dose em aberto nos próximos 30 dias.{" "}
            <Link href="/ong/prontuarios" className="underline">Ver prontuários</Link>
          </p>
        </div>
      )}

      {/* Cards de métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pets em cuidado", value: totalPets ?? 0, icon: PawPrint, color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20", href: "/ong/pets" },
          { label: "Em processo de adoção", value: emAdocao ?? 0, icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", href: "/ong/adocoes" },
          { label: "Adotados (ativos)", value: adotados ?? 0, icon: Users, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", href: "/ong/adocoes" },
          { label: "Medicações ativas", value: medicacoesAtivas ?? 0, icon: ClipboardList, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", href: "/ong/prontuarios" },
        ].map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className={`relative rounded-xl border p-5 transition hover:opacity-90 ${bg}`}>
            <Icon className={`mb-3 h-6 w-6 ${color}`} />
            <p className="font-display text-3xl font-bold text-fg">{value}</p>
            <p className="mt-0.5 text-sm text-fg-muted">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Últimos resgatados */}
        <section className="rounded-xl border border-white/10 bg-ink-700/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-fg">Últimos resgatados</h2>
            <Link href="/ong/pets" className="text-xs text-brand-400 hover:text-brand-300">Ver todos →</Link>
          </div>
          {!recentes?.length ? (
            <p className="text-sm text-fg-muted">Nenhum pet cadastrado ainda.</p>
          ) : (
            <ul className="space-y-3">
              {recentes.map((p) => {
                const pet = p.pets as { name: string | null; species: string; photo_url: string | null } | null;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/ong/prontuarios/${p.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-ink-700"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-600 text-xl">
                        {pet?.photo_url
                          ? <img src={pet.photo_url} alt="" className="h-full w-full object-cover" />
                          : (SPECIES[pet?.species ?? "other"] ?? "🐾")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">
                          {pet?.name ?? "Sem nome"}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-fg-muted">
                          <Clock className="h-3 w-3" />
                          Resgatado em {new Date(p.data_resgate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${SAUDE_COLOR[p.situacao_saude] ?? ""}`}>
                        {SAUDE_LABEL[p.situacao_saude] ?? p.situacao_saude}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Acompanhamentos pendentes */}
        <section className="rounded-xl border border-white/10 bg-ink-700/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-fg">Acompanhamentos pendentes</h2>
            <Link href="/ong/adocoes" className="text-xs text-brand-400 hover:text-brand-300">Ver todos →</Link>
          </div>
          {!pendentesAcomp?.length ? (
            <p className="text-sm text-fg-muted">Nenhum acompanhamento pendente. 🎉</p>
          ) : (
            <ul className="space-y-3">
              {pendentesAcomp.map((a) => {
                const dias = Math.floor(
                  (hoje.getTime() - new Date(a.data_adocao).getTime()) / 86400_000
                );
                const pending30 = !a.acompanhamento_30d && dias >= 30;
                const pending90 = !a.acompanhamento_90d && dias >= 90;
                return (
                  <li key={a.id}>
                    <Link
                      href={`/ong/adocoes/${a.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg p-2 transition hover:bg-ink-700"
                    >
                      <div>
                        <p className="text-sm font-medium text-fg">{a.adotante_nome}</p>
                        <p className="text-xs text-fg-muted">
                          Adotado há {dias} dias
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {pending30 && (
                          <span className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
                            30 dias
                          </span>
                        )}
                        {pending90 && (
                          <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-bold text-brand-300">
                            90 dias
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* CTA cadastro de pet */}
      <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-5">
        <p className="font-display text-base font-bold text-fg">
          Tem um pet novo para registrar?
        </p>
        <p className="mt-1 text-sm text-fg-muted">
          Cadastre o pet no sistema e crie o prontuário médico para manter o histórico completo.
        </p>
        <div className="mt-3 flex gap-3">
          <Link
            href="/pets/novo"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-400"
          >
            + Cadastrar pet
          </Link>
          <Link
            href="/ong/prontuarios/novo"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-fg hover:bg-white/10"
          >
            + Abrir prontuário
          </Link>
        </div>
      </div>
    </div>
  );
}
