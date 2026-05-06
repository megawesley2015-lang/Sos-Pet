import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Plus, Phone, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { NovaAdocaoModal } from "./NovaAdocaoModal";
import { AcompanhamentoActions } from "./AcompanhamentoActions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Adoções — ONG SOS Pet" };

const STATUS_STYLE: Record<string, string> = {
  ativo:       "border-green-500/40 bg-green-500/10 text-green-300",
  devolvido:   "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
  falecido:    "border-white/20 bg-white/5 text-fg-muted",
  transferido: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300",
};

export default async function AdocoesPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  const { data: adocoes } = await supabase
    .from("adocoes")
    .select(`
      id, adotante_nome, adotante_email, adotante_telefone,
      data_adocao, status, acompanhamento_30d, acompanhamento_90d,
      observacoes, pets ( id, name, species, photo_url )
    `)
    .eq("ong_id", user.id)
    .order("data_adocao", { ascending: false });

  // Pets disponíveis para registrar adoção — query separada para evitar join tipado
  const { data: petsDisponiveisRaw } = await supabase
    .from("prontuarios")
    .select("id, pet_id")
    .eq("ong_id", user.id)
    .limit(100);

  // Busca os dados dos pets em paralelo
  const petIds = (petsDisponiveisRaw ?? []).map((p) => p.pet_id).filter(Boolean);
  const { data: petsData } = petIds.length
    ? await supabase
        .from("pets")
        .select("id, name, species")
        .in("id", petIds)
    : { data: [] };

  const petMap = new Map((petsData ?? []).map((p) => [p.id, p]));
  const petsDisponiveis = (petsDisponiveisRaw ?? []).map((p) => ({
    prontuarioId: p.id,
    petId: p.pet_id ?? "",
    petName: petMap.get(p.pet_id)?.name ?? "Sem nome",
  }));

  const hoje = new Date();
  type Adocao = {
    id: string; adotante_nome: string; adotante_email: string | null;
    adotante_telefone: string; data_adocao: string; status: string;
    acompanhamento_30d: boolean; acompanhamento_90d: boolean;
    observacoes: string | null;
    pets: { id: string; name: string | null; species: string; photo_url: string | null } | null;
  };

  const SPECIES: Record<string, string> = { dog: "🐕", cat: "🐈", other: "🐾" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-fg">Controle de Adoções</h1>
          <p className="text-sm text-fg-muted">{adocoes?.length ?? 0} adoção(ões) registrada(s)</p>
        </div>
        <NovaAdocaoModal
          ongId={user.id}
          pets={petsDisponiveis}
        />
      </div>

      {!adocoes?.length ? (
        <div className="py-16 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-fg-subtle" />
          <p className="text-fg-muted">Nenhuma adoção registrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(adocoes as Adocao[]).map((a) => {
            const dias = Math.floor((hoje.getTime() - new Date(a.data_adocao).getTime()) / 86400_000);
            const precisa30 = !a.acompanhamento_30d && dias >= 30 && a.status === "ativo";
            const precisa90 = !a.acompanhamento_90d && dias >= 90 && a.status === "ativo";
            const temAlerta = precisa30 || precisa90;
            const pet = a.pets;

            return (
              <div key={a.id} className={`rounded-xl border bg-ink-700/40 p-4 ${temAlerta ? "border-yellow-400/30" : "border-white/10"}`}>
                <div className="flex items-start gap-4">
                  {/* Pet avatar */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-600 text-2xl">
                    {pet?.photo_url
                      ? <img src={pet.photo_url} alt="" className="h-full w-full object-cover" />
                      : (SPECIES[pet?.species ?? "other"])}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="flex-1">
                        <p className="font-display text-sm font-bold text-fg">
                          {pet?.name ?? "Pet"} → {a.adotante_nome}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-fg-muted">
                          <Phone className="h-3 w-3" />
                          {a.adotante_telefone}
                          {a.adotante_email && ` · ${a.adotante_email}`}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[a.status] ?? ""}`}>
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs text-fg-muted">
                      Adotado em {new Date(a.data_adocao).toLocaleDateString("pt-BR")} · há {dias} dias
                    </p>

                    {/* Acompanhamentos */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <AcompCheckbox
                        done={a.acompanhamento_30d}
                        pending={precisa30}
                        label="30 dias"
                        adocaoId={a.id}
                        field="acompanhamento_30d"
                      />
                      <AcompCheckbox
                        done={a.acompanhamento_90d}
                        pending={precisa90}
                        label="90 dias"
                        adocaoId={a.id}
                        field="acompanhamento_90d"
                      />
                    </div>

                    {a.observacoes && (
                      <p className="mt-2 text-[11px] text-fg-subtle">{a.observacoes}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AcompCheckbox({
  done, pending, label, adocaoId, field,
}: {
  done: boolean; pending: boolean; label: string; adocaoId: string; field: string;
}) {
  if (done) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
        <CheckCircle2 className="h-3 w-3" /> {label}
      </span>
    );
  }
  if (pending) {
    return (
      <AcompanhamentoActions adocaoId={adocaoId} field={field} label={label} />
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-fg-subtle">
      <Clock className="h-3 w-3" /> {label}
    </span>
  );
}
