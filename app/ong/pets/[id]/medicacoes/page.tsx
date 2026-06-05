import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pill, CheckCircle2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { AddMedicationForm } from "./AddMedicationForm";
import { finalizeMedication } from "./actions";

export const revalidate = 0;
export const metadata = { title: "Medicações — Painel ONG" };

export default async function MedicacoesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  const { data: pet } = await supabase
    .from("shelter_pets")
    .select("id, name, shelters!inner(user_id)")
    .eq("id", id)
    .maybeSingle();

  if (!pet) notFound();
  
  if (pet.shelters.user_id !== user.id) notFound();

  const { data: medications } = await supabase
    .from("medications")
    .select("id, medication_name, dosage, frequency, start_date, end_date, is_ongoing, reason, notes")
    .eq("pet_id", id)
    .order("is_ongoing", { ascending: false })
    .order("start_date", { ascending: false });

  const active = medications?.filter((m) => m.is_ongoing) ?? [];
  const finished = medications?.filter((m) => !m.is_ongoing) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/ong/pets/${id}`} className="rounded-lg p-2 text-fg-muted hover:bg-ink-700 hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-fg">Medicações</h1>
          <p className="text-sm text-fg-muted">{pet.name ?? "Pet sem nome"}</p>
        </div>
      </div>

      <AddMedicationForm petId={id} />

      {/* Medicações ativas */}
      {active.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-fg">
            Em curso ({active.length})
          </h2>
          <div className="space-y-3">
            {active.map((med) => (
              <div key={med.id} className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
                <div className="flex items-start gap-3">
                  <Pill className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-fg">{med.medication_name}</p>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-fg-muted">
                      <span>Dose: {med.dosage}</span>
                      <span>Frequência: {med.frequency}</span>
                      <span>
                        Desde: {new Date(med.start_date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {med.reason && (
                      <p className="mt-1.5 text-xs text-fg-subtle">Motivo: {med.reason}</p>
                    )}
                    {med.notes && (
                      <p className="mt-0.5 text-xs text-fg-subtle">{med.notes}</p>
                    )}
                  </div>
                  <form action={finalizeMedication.bind(null, id, med.id)}>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-2.5 py-1.5 text-xs font-bold text-success transition hover:bg-success/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Finalizar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medicações finalizadas */}
      {finished.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-fg-muted">
            Histórico ({finished.length})
          </h2>
          <div className="space-y-2">
            {finished.map((med) => (
              <div key={med.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-ink-700/30 p-3 opacity-70">
                <Pill className="h-4 w-4 shrink-0 text-fg-subtle" />
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-medium text-fg">{med.medication_name}</span>
                  <span className="ml-2 text-xs text-fg-muted">
                    {med.dosage} · {med.frequency}
                  </span>
                </div>
                {med.end_date && (
                  <span className="text-xs text-fg-subtle">
                    Até {new Date(med.end_date).toLocaleDateString("pt-BR")}
                  </span>
                )}
                <span className="rounded-full border border-success/20 px-2 py-0.5 text-[10px] text-success">
                  Concluída
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!medications || medications.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-fg-muted">
          Nenhuma medicação registrada ainda.
        </p>
      ) : null}
    </div>
  );
}
