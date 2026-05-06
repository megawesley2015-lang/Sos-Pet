import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Syringe, Pill, Weight, Cpu, Calendar, PawPrint } from "lucide-react";
import { VacinaForm } from "./VacinaForm";
import { MedicacaoForm } from "./MedicacaoForm";
import { ProntuarioActions } from "./ProntuarioActions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prontuário — ONG SOS Pet" };

const SAUDE_COLOR: Record<string, string> = {
  critica: "border-danger/50 text-danger",
  regular: "border-yellow-400/50 text-yellow-300",
  boa: "border-green-400/50 text-green-300",
  excelente: "border-cyan-400/50 text-cyan-300",
};
const SAUDE_LABEL: Record<string, string> = {
  critica: "Crítica", regular: "Regular", boa: "Boa", excelente: "Excelente",
};

export default async function ProntuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  const { data: pron } = await supabase
    .from("prontuarios")
    .select(`
      id, data_resgate, situacao_saude, peso_kg, castrado, microchip, observacoes,
      pets ( id, name, species, photo_url, city, neighborhood, contact_phone )
    `)
    .eq("id", id)
    .eq("ong_id", user.id)
    .maybeSingle();

  if (!pron) notFound();

  const [{ data: vacinas }, { data: medicacoes }] = await Promise.all([
    supabase
      .from("vacinas")
      .select("*")
      .eq("prontuario_id", id)
      .order("data_aplicacao", { ascending: false }),
    supabase
      .from("medicacoes")
      .select("*")
      .eq("prontuario_id", id)
      .order("ativa", { ascending: false })
      .order("data_inicio", { ascending: false }),
  ]);

  type PetDetail = {
    id: string; name: string | null; species: string;
    photo_url: string | null; city: string; neighborhood: string; contact_phone: string;
  };
  // Supabase retorna joins como array ou objeto dependendo do generic — normaliza aqui
  const petsRaw = pron.pets as unknown as PetDetail[] | PetDetail | null;
  const pet: PetDetail | null = Array.isArray(petsRaw) ? (petsRaw[0] ?? null) : petsRaw;

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Navegação */}
      <Link href="/ong/pets" className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Voltar para pets
      </Link>

      {/* Header do prontuário */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-700/40">
        <div className="flex items-start gap-4 p-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ink-600 text-4xl">
            {pet?.photo_url
              ? <img src={pet.photo_url} alt="" className="h-full w-full object-cover" />
              : (pet?.species === "dog" ? "🐕" : pet?.species === "cat" ? "🐈" : "🐾")}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-xl font-bold text-fg">
                  {pet?.name ?? "Sem nome"}
                </h1>
                <p className="text-sm text-fg-muted">
                  {pet?.city} · {pet?.neighborhood}
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${SAUDE_COLOR[pron.situacao_saude] ?? ""}`}>
                {SAUDE_LABEL[pron.situacao_saude]}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {pron.peso_kg && (
                <div className="flex items-center gap-1 text-xs text-fg-muted">
                  <Weight className="h-3.5 w-3.5" /> {pron.peso_kg} kg
                </div>
              )}
              {pron.castrado && (
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-bold text-cyan-400">
                  Castrado(a)
                </span>
              )}
              {pron.microchip && (
                <div className="flex items-center gap-1 text-xs text-fg-muted">
                  <Cpu className="h-3.5 w-3.5" /> {pron.microchip}
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-fg-muted">
                <Calendar className="h-3.5 w-3.5" />
                Resgate: {new Date(pron.data_resgate).toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>
        </div>
        {pron.observacoes && (
          <div className="border-t border-white/10 px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">Observações gerais</p>
            <p className="mt-1 text-sm text-fg">{pron.observacoes}</p>
          </div>
        )}
        <div className="flex gap-2 border-t border-white/10 px-5 py-3">
          <Link
            href={`/pets/${pet?.id}`}
            className="text-xs text-brand-400 hover:underline"
          >
            Ver perfil público →
          </Link>
          <span className="text-xs text-fg-subtle">·</span>
          <ProntuarioActions prontuarioId={id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vacinas */}
        <section className="rounded-xl border border-white/10 bg-ink-700/40 p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-fg">
            <Syringe className="h-4 w-4 text-cyan-400" /> Vacinas
          </h2>

          {!vacinas?.length ? (
            <p className="mb-4 text-sm text-fg-muted">Nenhuma vacina registrada.</p>
          ) : (
            <ul className="mb-4 space-y-2">
              {vacinas.map((v) => {
                const atrasada = v.proxima_dose && v.proxima_dose < hoje;
                const proxima = v.proxima_dose && !atrasada && v.proxima_dose <= new Date(Date.now() + 30*86400_000).toISOString().slice(0,10);
                return (
                  <li key={v.id} className="rounded-lg border border-white/5 bg-ink-800/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-fg">{v.nome}</p>
                      {atrasada && (
                        <span className="shrink-0 rounded-full bg-danger/15 px-2 py-0.5 text-[9px] font-black text-danger">
                          Atrasada
                        </span>
                      )}
                      {proxima && (
                        <span className="shrink-0 rounded-full bg-yellow-400/15 px-2 py-0.5 text-[9px] font-black text-yellow-400">
                          Em breve
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-fg-muted">
                      <span>Aplicada: {new Date(v.data_aplicacao).toLocaleDateString("pt-BR")}</span>
                      {v.proxima_dose && (
                        <span>Próxima: {new Date(v.proxima_dose).toLocaleDateString("pt-BR")}</span>
                      )}
                      {v.veterinario && <span>Vet: {v.veterinario}</span>}
                      {v.lote && <span>Lote: {v.lote}</span>}
                    </div>
                    {v.observacao && <p className="mt-1 text-[11px] text-fg-subtle">{v.observacao}</p>}
                  </li>
                );
              })}
            </ul>
          )}

          <VacinaForm prontuarioId={id} />
        </section>

        {/* Medicações */}
        <section className="rounded-xl border border-white/10 bg-ink-700/40 p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-fg">
            <Pill className="h-4 w-4 text-brand-400" /> Medicações
          </h2>

          {!medicacoes?.length ? (
            <p className="mb-4 text-sm text-fg-muted">Nenhuma medicação registrada.</p>
          ) : (
            <ul className="mb-4 space-y-2">
              {medicacoes.map((m) => (
                <li key={m.id} className={`rounded-lg border p-3 ${m.ativa ? "border-brand-500/20 bg-brand-500/5" : "border-white/5 bg-ink-800/50 opacity-60"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-fg">{m.nome}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${m.ativa ? "bg-brand-500/20 text-brand-300" : "bg-white/10 text-fg-muted"}`}>
                      {m.ativa ? "Ativa" : "Encerrada"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-fg-muted">
                    {m.dosagem && <span>Dose: {m.dosagem}</span>}
                    {m.frequencia && <span>Freq: {m.frequencia}</span>}
                    <span>Início: {new Date(m.data_inicio).toLocaleDateString("pt-BR")}</span>
                    {m.data_fim && <span>Fim: {new Date(m.data_fim).toLocaleDateString("pt-BR")}</span>}
                  </div>
                  {m.observacao && <p className="mt-1 text-[11px] text-fg-subtle">{m.observacao}</p>}
                </li>
              ))}
            </ul>
          )}

          <MedicacaoForm prontuarioId={id} />
        </section>
      </div>
    </div>
  );
}
