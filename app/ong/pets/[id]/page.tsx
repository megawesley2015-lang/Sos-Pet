import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ClipboardList, Syringe, Pill, Heart, PawPrint, Pencil, Scale, Cpu, Scissors } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import type { HealthStatus, ShelterPetStatus } from "@/lib/types/database";

export const revalidate = 0;

const HEALTH_COLOR: Record<HealthStatus, string> = {
  healthy: "border-success/40 bg-success/10 text-success",
  recovering: "border-brand-500/40 bg-brand-500/10 text-brand-300",
  critical: "border-danger/40 bg-danger/10 text-danger",
  treated: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
};

const HEALTH_LABEL: Record<HealthStatus, string> = {
  healthy: "Saudável",
  recovering: "Em recuperação",
  critical: "Estado crítico",
  treated: "Tratado",
};

const STATUS_LABEL: Record<ShelterPetStatus, string> = {
  available: "Disponível para adoção",
  fostered: "Em lar temporário",
  adopted: "Adotado",
  deceased: "Falecido",
};

const SEX_LABEL = { male: "Macho", female: "Fêmea", unknown: "Não identificado" };
const SIZE_LABEL = { small: "Pequeno", medium: "Médio", large: "Grande" };

export default async function OngPetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  const { data: pet } = await supabase
    .from("shelter_pets")
    .select("*, shelters!inner(user_id, name)")
    .eq("id", id)
    .maybeSingle();

  if (!pet) notFound();

  if (pet.shelters.user_id !== user.id) notFound();

  const [
    { count: recordCount },
    { count: vaccineCount },
    { data: activeMeds },
    { data: lastRecord },
    { data: nextVaccine },
  ] = await Promise.all([
    supabase.from("medical_records").select("*", { count: "exact", head: true }).eq("pet_id", id),
    supabase.from("vaccinations").select("*", { count: "exact", head: true }).eq("pet_id", id),
    supabase.from("medications").select("medication_name, dosage, frequency").eq("pet_id", id).eq("is_ongoing", true),
    supabase
      .from("medical_records")
      .select("record_date, type, description")
      .eq("pet_id", id)
      .order("record_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("vaccinations")
      .select("vaccine_name, next_dose_date")
      .eq("pet_id", id)
      .not("next_dose_date", "is", null)
      .order("next_dose_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const RECORD_TYPE_LABEL: Record<string, string> = {
    consultation: "Consulta",
    surgery: "Cirurgia",
    exam: "Exame",
    treatment: "Tratamento",
    observation: "Observação",
  };

  const quickLinks = [
    { href: `/ong/pets/${id}/prontuario`, label: "Prontuário", icon: ClipboardList, count: recordCount },
    { href: `/ong/pets/${id}/vacinas`, label: "Vacinas", icon: Syringe, count: vaccineCount },
    { href: `/ong/pets/${id}/medicacoes`, label: "Medicações", icon: Pill, count: activeMeds?.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ong/pets" className="rounded-lg p-2 text-fg-muted hover:bg-ink-700 hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-xl font-bold text-fg flex-1">
          {pet.name ?? "Pet sem nome"}
        </h1>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${HEALTH_COLOR[pet.health_status as HealthStatus]}`}>
          {HEALTH_LABEL[pet.health_status as HealthStatus]}
        </span>
        <Link
          href={`/ong/pets/${id}/editar`}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-ink-700 px-3 py-2 text-xs font-medium text-fg-muted transition hover:bg-ink-600 hover:text-fg"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-ink-700 lg:col-span-1">
          {pet.photo_url ? (
            <Image src={pet.photo_url} alt={pet.name ?? "Pet"} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <PawPrint className="h-16 w-16 text-fg-subtle/30" strokeWidth={1} />
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              Informações gerais
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                ["Espécie", pet.species === "dog" ? "Cão" : pet.species === "cat" ? "Gato" : "Outro"],
                ["Raça", pet.breed ?? "Não informada"],
                ["Cor", pet.color],
                ["Porte", SIZE_LABEL[pet.size as keyof typeof SIZE_LABEL]],
                ["Sexo", SEX_LABEL[pet.sex as keyof typeof SEX_LABEL]],
                ["Idade estimada", pet.estimated_age ?? "Não informada"],
                ["Data de resgate", new Date(pet.rescue_date).toLocaleDateString("pt-BR")],
                ["Local do resgate", pet.rescue_location ?? "Não informado"],
                ["Status", STATUS_LABEL[pet.status as ShelterPetStatus]],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-fg-muted">{label}</dt>
                  <dd className="font-medium text-fg">{value}</dd>
                </div>
              ))}
            </dl>
            {pet.behavior && (
              <div className="mt-3 border-t border-white/5 pt-3">
                <p className="text-xs text-fg-muted">Comportamento</p>
                <p className="mt-0.5 text-sm text-fg">{pet.behavior}</p>
              </div>
            )}
            {pet.description && (
              <div className="mt-3 border-t border-white/5 pt-3">
                <p className="text-xs text-fg-muted">Descrição</p>
                <p className="mt-0.5 text-sm text-fg">{pet.description}</p>
              </div>
            )}
          </div>

          {(pet.weight_kg || pet.microchip || pet.is_castrated) && (
            <div className="rounded-xl border border-cyan-500/20 bg-ink-700/50 p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                Prontuário
              </h2>
              <div className="flex flex-wrap gap-4 text-sm">
                {pet.weight_kg && (
                  <div className="flex items-center gap-2 text-fg-muted">
                    <Scale className="h-4 w-4 shrink-0 text-cyan-400" />
                    <span className="font-medium text-fg">{pet.weight_kg} kg</span>
                  </div>
                )}
                {pet.microchip && (
                  <div className="flex items-center gap-2 text-fg-muted">
                    <Cpu className="h-4 w-4 shrink-0 text-cyan-400" />
                    <span>Microchip <span className="font-medium text-fg">{pet.microchip}</span></span>
                  </div>
                )}
                {pet.is_castrated && (
                  <div className="flex items-center gap-2 text-success">
                    <Scissors className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Castrado</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {nextVaccine?.next_dose_date && new Date(nextVaccine.next_dose_date) <= new Date() && (
            <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3">
              <p className="text-sm text-brand-200">
                Vacina <strong>{nextVaccine.vaccine_name}</strong> com próxima dose em atraso (
                {new Date(nextVaccine.next_dose_date).toLocaleDateString("pt-BR")}).
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {quickLinks.map(({ href, label, icon: Icon, count }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-700/50 p-4 transition hover:border-cyan-500/30 hover:shadow-glow-cyan"
          >
            <Icon className="h-6 w-6 text-cyan-400" />
            <div>
              <p className="font-semibold text-fg">{label}</p>
              <p className="text-xs text-fg-muted">{count ?? 0} registro(s)</p>
            </div>
          </Link>
        ))}
      </div>

      {lastRecord && (
        <div className="rounded-xl border border-white/10 bg-ink-700/30 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            Último registro no prontuário
          </p>
          <div className="flex items-start gap-2">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-bold text-cyan-300">
              {RECORD_TYPE_LABEL[lastRecord.type]}
            </span>
            <div>
              <p className="text-sm text-fg">{lastRecord.description}</p>
              <p className="mt-0.5 text-xs text-fg-subtle">
                {new Date(lastRecord.record_date).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeMeds && activeMeds.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-ink-700/30 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            Medicações em curso ({activeMeds.length})
          </p>
          <div className="space-y-2">
            {activeMeds.map((med, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Pill className="h-4 w-4 shrink-0 text-brand-400" />
                <span className="font-medium text-fg">{med.medication_name}</span>
                <span className="text-fg-muted">
                  {med.dosage} - {med.frequency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pet.status === "available" && (
        <Link
          href={`/ong/adocoes/novo?pet=${id}`}
          className="flex items-center justify-center gap-2 rounded-xl border border-brand-500/40 bg-brand-500/10 py-4 text-sm font-bold text-brand-200 transition hover:bg-brand-500/20 hover:shadow-glow-brand"
        >
          <Heart className="h-4 w-4" />
          Registrar adoção
        </Link>
      )}
    </div>
  );
}
