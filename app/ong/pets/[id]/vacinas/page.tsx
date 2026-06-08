import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Syringe, Trash2, AlertCircle } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { AddVaccineForm } from "./AddVaccineForm";
import { deleteVaccination } from "./actions";
import { calcVaccineBadge } from "@/lib/validation/ong";

export const revalidate = 0;
export const metadata = { title: "Vacinas — Painel ONG" };

export default async function VacinasPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: vaccines } = await supabase
    .from("vaccinations")
    .select("id, vaccine_name, applied_date, next_dose_date, vet_name, batch, notes")
    .eq("pet_id", id)
    .order("applied_date", { ascending: false });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/ong/pets/${id}`} className="rounded-lg p-2 text-fg-muted hover:bg-ink-700 hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-fg">Vacinas</h1>
          <p className="text-sm text-fg-muted">{pet.name ?? "Pet sem nome"}</p>
        </div>
      </div>

      <AddVaccineForm petId={id} />

      {!vaccines || vaccines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-fg-muted">
          Nenhuma vacina registrada ainda.
        </p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">
            Histórico ({vaccines.length} vacina{vaccines.length !== 1 ? "s" : ""})
          </h2>
          {vaccines.map((v) => {
            const badge = calcVaccineBadge(v.next_dose_date ?? null, today);
            const daysUntil = v.next_dose_date
              ? Math.ceil((new Date(v.next_dose_date).getTime() - new Date(today).getTime()) / 86_400_000)
              : null;
            return (
              <div
                key={v.id}
                className={`rounded-xl border p-4 ${
                  badge === "overdue"  ? "border-danger/30 bg-danger/10" :
                  badge === "warning"  ? "border-brand-500/30 bg-brand-500/10" :
                  "border-white/10 bg-ink-700/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Syringe className={`mt-0.5 h-5 w-5 shrink-0 ${
                    badge === "overdue" ? "text-danger" :
                    badge === "warning" ? "text-brand-400" : "text-cyan-400"
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-fg">{v.vaccine_name}</p>
                      {badge === "overdue" && (
                        <span className="flex items-center gap-1 rounded-full border border-danger/40 bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">
                          <AlertCircle className="h-3 w-3" />
                          🔴 Atrasada
                        </span>
                      )}
                      {badge === "warning" && daysUntil !== null && (
                        <span className="flex items-center gap-1 rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-300">
                          <AlertCircle className="h-3 w-3" />
                          ⚠️ Vence em {daysUntil} dia{daysUntil !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-fg-muted">
                      <span>
                        Aplicada: {new Date(v.applied_date).toLocaleDateString("pt-BR")}
                      </span>
                      {v.next_dose_date && (
                        <span className={badge ? "font-bold text-fg-muted" : ""}>
                          Próxima dose: {new Date(v.next_dose_date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {v.vet_name && <span>Dr(a). {v.vet_name}</span>}
                      {v.batch && <span>Lote: {v.batch}</span>}
                    </div>
                    {v.notes && <p className="mt-1.5 text-xs text-fg-subtle">{v.notes}</p>}
                  </div>
                  <form action={deleteVaccination.bind(null, id, v.id)}>
                    <button
                      type="submit"
                      className="rounded p-1.5 text-fg-subtle hover:bg-danger/10 hover:text-danger"
                      title="Remover vacina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
