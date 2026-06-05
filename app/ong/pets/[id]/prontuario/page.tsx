import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { AddMedicalRecordForm } from "./AddMedicalRecordForm";

export const revalidate = 0;
export const metadata = { title: "Prontuário — Painel ONG" };

const RECORD_TYPE_LABEL: Record<string, string> = {
  consultation: "Consulta",
  surgery: "Cirurgia",
  exam: "Exame",
  treatment: "Tratamento",
  observation: "Observação",
};

const RECORD_TYPE_COLOR: Record<string, string> = {
  consultation: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  surgery: "border-danger/30 bg-danger/10 text-danger",
  exam: "border-fg-subtle/30 bg-ink-600/40 text-fg-muted",
  treatment: "border-brand-500/30 bg-brand-500/10 text-brand-300",
  observation: "border-white/10 bg-ink-600/30 text-fg-subtle",
};

export default async function ProntuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  const { data: pet } = await supabase
    .from("shelter_pets")
    .select("id, name, species, shelters!inner(user_id)")
    .eq("id", id)
    .maybeSingle();

  if (!pet) notFound();
  
  if (pet.shelters.user_id !== user.id) notFound();

  const { data: records } = await supabase
    .from("medical_records")
    .select("id, record_date, type, description, vet_name, weight_kg, notes")
    .eq("pet_id", id)
    .order("record_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/ong/pets/${id}`} className="rounded-lg p-2 text-fg-muted hover:bg-ink-700 hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-fg">Prontuário</h1>
          <p className="text-sm text-fg-muted">{pet.name ?? "Pet sem nome"}</p>
        </div>
      </div>

      {/* Formulário de novo registro */}
      <AddMedicalRecordForm petId={id} />

      {/* Lista de registros */}
      {!records || records.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-fg-muted">
          Nenhum registro no prontuário ainda.
        </p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">
            Histórico ({records.length} registro{records.length !== 1 ? "s" : ""})
          </h2>
          {records.map((rec) => (
            <div key={rec.id} className="rounded-xl border border-white/10 bg-ink-700/40 p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    RECORD_TYPE_COLOR[rec.type]
                  }`}
                >
                  {RECORD_TYPE_LABEL[rec.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-fg">{rec.description}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-fg-muted">
                    <span>
                      {new Date(rec.record_date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    {rec.vet_name && <span>Dr(a). {rec.vet_name}</span>}
                    {rec.weight_kg && <span>Peso: {rec.weight_kg} kg</span>}
                  </div>
                  {rec.notes && (
                    <p className="mt-2 text-xs text-fg-subtle">{rec.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
