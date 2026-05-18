import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Syringe, Pill, PawPrint } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import type { HealthStatus, PetSpecies } from "@/lib/types/database";

export const revalidate = 0;
export const metadata = { title: "Prontuários — Painel ONG" };

const HEALTH_COLOR: Record<HealthStatus, string> = {
  healthy: "border-success/40 bg-success/10 text-success",
  recovering: "border-brand-500/40 bg-brand-500/10 text-brand-300",
  critical: "border-danger/40 bg-danger/10 text-danger",
  treated: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
};
const HEALTH_LABEL: Record<HealthStatus, string> = {
  healthy: "Saudável",
  recovering: "Recuperação",
  critical: "Crítico",
  treated: "Tratado",
};
const SPECIES_ICON: Record<PetSpecies, string> = { dog: "🐶", cat: "🐱", other: "🐾" };

export default async function ProntuariosPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login?next=/ong/prontuarios");

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shelter) redirect("/ong/cadastro");

  // Busca todos os pets do shelter com resumo do prontuário em paralelo
  const { data: pets } = await supabase
    .from("shelter_pets")
    .select("id, name, species, breed, health_status, status, weight_kg, microchip, is_castrated, rescue_date")
    .eq("shelter_id", shelter.id)
    .not("status", "eq", "deceased")   // excluir falecidos por padrão
    .order("health_status", { ascending: true }) // critical primeiro (alfabético coincide aqui)
    .order("rescue_date", { ascending: false });

  const today = new Date().toISOString().split("T")[0];

  // Para cada pet, busca resumo médico (último registro, última vacina, medicações ativas)
  const petIds = (pets ?? []).map((p) => p.id);

  const [
    { data: lastRecords },
    { data: vaccinesDue },
    { data: activeMeds },
  ] = await Promise.all([
    // Último registro médico por pet
    petIds.length
      ? supabase
          .from("medical_records")
          .select("pet_id, record_date, type, description")
          .in("pet_id", petIds)
          .order("record_date", { ascending: false })
      : Promise.resolve({ data: [] }),

    // Vacinas com próxima dose vencida ou a vencer
    petIds.length
      ? supabase
          .from("vaccinations")
          .select("pet_id, vaccine_name, next_dose_date")
          .in("pet_id", petIds)
          .not("next_dose_date", "is", null)
          .order("next_dose_date", { ascending: true })
      : Promise.resolve({ data: [] }),

    // Medicações ativas
    petIds.length
      ? supabase
          .from("medications")
          .select("pet_id, medication_name")
          .in("pet_id", petIds)
          .eq("is_ongoing", true)
      : Promise.resolve({ data: [] }),
  ]);

  type LastRecord = { pet_id: string; record_date: string; type: string; description: string };
  type VaccineDue = { pet_id: string; vaccine_name: string; next_dose_date: string | null };

  // Indexa por pet_id (pega apenas o primeiro/mais recente de cada)
  const lastRecordByPet = new Map<string, LastRecord>();
  for (const r of (lastRecords ?? []) as LastRecord[]) {
    if (!lastRecordByPet.has(r.pet_id)) lastRecordByPet.set(r.pet_id, r);
  }

  const vaccineDueByPet = new Map<string, VaccineDue>();
  for (const v of (vaccinesDue ?? []) as VaccineDue[]) {
    if (!vaccineDueByPet.has(v.pet_id)) vaccineDueByPet.set(v.pet_id, v);
  }

  const activemedsByPet = new Map<string, string[]>();
  for (const m of activeMeds ?? []) {
    const list = activemedsByPet.get(m.pet_id) ?? [];
    list.push(m.medication_name);
    activemedsByPet.set(m.pet_id, list);
  }

  const RECORD_TYPE_LABEL: Record<string, string> = {
    consultation: "Consulta",
    surgery: "Cirurgia",
    exam: "Exame",
    treatment: "Tratamento",
    observation: "Observação",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Prontuários</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Visão médica de todos os pets do abrigo — clique para acessar o prontuário completo.
        </p>
      </div>

      {!pets || pets.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/10 bg-ink-700/20 py-16">
          <FileText className="h-12 w-12 text-fg-subtle/40" strokeWidth={1} />
          <p className="text-sm text-fg-muted">Nenhum pet cadastrado ainda.</p>
          <Link
            href="/ong/pets/novo"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white"
          >
            Cadastrar primeiro pet
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {pets.map((pet) => {
            const lastRecord = lastRecordByPet.get(pet.id);
            const nextVaccine = vaccineDueByPet.get(pet.id);
            const meds = activemedsByPet.get(pet.id) ?? [];
            const vaccineOverdue = nextVaccine?.next_dose_date && nextVaccine.next_dose_date <= today;

            return (
              <Link
                key={pet.id}
                href={`/ong/pets/${pet.id}/prontuario`}
                className="block rounded-xl border border-white/5 bg-ink-700/50 p-4 transition hover:border-cyan-500/30 hover:shadow-glow-cyan"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar + nome */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-600 text-xl">
                    {SPECIES_ICON[pet.species as PetSpecies]}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-fg">{pet.name ?? "Sem nome"}</p>
                      {pet.is_castrated && (
                        <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400">
                          Castrado
                        </span>
                      )}
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${HEALTH_COLOR[pet.health_status as HealthStatus]}`}>
                        {HEALTH_LABEL[pet.health_status as HealthStatus]}
                      </span>
                    </div>

                    {/* Dados do prontuário */}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-fg-muted">
                      {pet.weight_kg && (
                        <span className="flex items-center gap-1">
                          <PawPrint className="h-3 w-3" />
                          {pet.weight_kg} kg
                        </span>
                      )}
                      {pet.microchip && (
                        <span className="flex items-center gap-1">
                          📡 {pet.microchip}
                        </span>
                      )}
                      {lastRecord ? (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Último: {RECORD_TYPE_LABEL[lastRecord.type] ?? lastRecord.type} em{" "}
                          {new Date(lastRecord.record_date).toLocaleDateString("pt-BR")}
                        </span>
                      ) : (
                        <span className="text-fg-subtle">Sem registros médicos</span>
                      )}
                    </div>

                    {/* Alertas de vacina + medicações */}
                    {(nextVaccine || meds.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {nextVaccine && (
                          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            vaccineOverdue
                              ? "bg-danger/10 text-danger"
                              : "bg-brand-500/10 text-brand-300"
                          }`}>
                            <Syringe className="h-3 w-3" />
                            {nextVaccine.vaccine_name}{" "}
                            {vaccineOverdue
                              ? "⚠️ atrasada"
                              : `→ ${new Date(nextVaccine.next_dose_date!).toLocaleDateString("pt-BR")}`}
                          </span>
                        )}
                        {meds.map((med) => (
                          <span
                            key={med}
                            className="flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-300"
                          >
                            <Pill className="h-3 w-3" />
                            {med}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Seta */}
                  <span className="shrink-0 text-sm text-fg-subtle">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
