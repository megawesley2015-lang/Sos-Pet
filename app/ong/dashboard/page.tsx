import { redirect } from "next/navigation";
import Link from "next/link";
import { PawPrint, Heart, Syringe, Pill, AlertTriangle, FileText } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";

export const revalidate = 60;
export const metadata = { title: "Dashboard — Painel ONG" };

export default async function OngDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login?next=/ong/dashboard");

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shelter) redirect("/ong/cadastro");

  const shelterId = shelter.id;
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [
    { count: totalPets },
    { count: adoptedPets },
    { count: criticalPets },
    { count: activeMeds },
    { count: totalRecords },
    { data: recentPets },
    { data: vaccinesDue },
    { data: followUpDue },
  ] = await Promise.all([
    // Total de pets (exceto adotados/falecidos) — ativos no abrigo
    supabase
      .from("shelter_pets")
      .select("*", { count: "exact", head: true })
      .eq("shelter_id", shelterId)
      .in("status", ["available", "fostered"]),

    // Adoções realizadas
    supabase
      .from("shelter_pets")
      .select("*", { count: "exact", head: true })
      .eq("shelter_id", shelterId)
      .eq("status", "adopted"),

    // Pets em estado crítico
    supabase
      .from("shelter_pets")
      .select("*", { count: "exact", head: true })
      .eq("shelter_id", shelterId)
      .eq("health_status", "critical"),

    // Medicações contínuas (RLS já filtra por pets do shelter)
    supabase
      .from("medications")
      .select("pet_id", { count: "exact", head: true })
      .eq("is_ongoing", true),

    // Total de prontuários
    supabase
      .from("medical_records")
      .select("id", { count: "exact", head: true }),

    // Últimos 5 resgatados
    supabase
      .from("shelter_pets")
      .select("id, name, species, health_status, status, rescue_date, is_castrated")
      .eq("shelter_id", shelterId)
      .order("created_at", { ascending: false })
      .limit(5),

    // Vacinas vencendo nos próximos 30 dias (inclui atrasadas)
    // RLS filtra automaticamente pelo shelter do usuário
    supabase
      .from("vaccinations")
      .select("id, vaccine_name, next_dose_date, pet_id, shelter_pets!inner(name, shelter_id)")
      .not("next_dose_date", "is", null)
      .lte("next_dose_date", thirtyDaysLater)
      .eq("shelter_pets.shelter_id", shelterId)
      .order("next_dose_date", { ascending: true })
      .limit(10),

    // Acompanhamentos pós-adoção pendentes: adoção tem 30+ dias E pelo menos um follow-up não registrado
    supabase
      .from("adoptions")
      .select("id, adopter_name, adoption_date, follow_up_30_date, follow_up_90_date, status, shelter_pets!inner(name, species)")
      .eq("shelter_id", shelterId)
      .eq("status", "active")
      .lte("adoption_date", thirtyDaysAgo)
      .or("follow_up_30_date.is.null,follow_up_90_date.is.null")
      .order("adoption_date", { ascending: true })
      .limit(8),
  ]);

  const HEALTH_LABEL: Record<string, string> = {
    healthy: "Saudável",
    recovering: "Em recuperação",
    critical: "Crítico",
    treated: "Tratado",
  };
  const HEALTH_COLOR: Record<string, string> = {
    healthy: "text-success bg-success/10 border-success/30",
    recovering: "text-brand-300 bg-brand-500/10 border-brand-500/30",
    critical: "text-danger bg-danger/10 border-danger/30",
    treated: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
  };
  const STATUS_LABEL: Record<string, string> = {
    available: "Disponível",
    fostered: "Lar temp.",
    adopted: "Adotado",
    deceased: "Falecido",
  };

  const vaccineDueCount = vaccinesDue?.length ?? 0;
  const followUpCount = followUpDue?.length ?? 0;
  const hasAlerts = (criticalPets ?? 0) > 0 || vaccineDueCount > 0 || followUpCount > 0;

  const cards = [
    {
      label: "Pets no abrigo",
      value: totalPets ?? 0,
      sub: "Disponíveis e em lar temporário",
      icon: PawPrint,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      href: "/ong/pets",
    },
    {
      label: "Prontuários",
      value: totalRecords ?? 0,
      sub: "Registros médicos totais",
      icon: FileText,
      color: "text-fg-muted",
      bg: "bg-ink-600/40 border-white/10",
      href: "/ong/prontuarios",
    },
    {
      label: "Adoções realizadas",
      value: adoptedPets ?? 0,
      sub: "Total histórico",
      icon: Heart,
      color: "text-brand-400",
      bg: "bg-brand-500/10 border-brand-500/20",
      href: "/ong/adocoes",
    },
    {
      label: "Em medicação contínua",
      value: activeMeds ?? 0,
      sub: "Medicamentos em curso",
      icon: Pill,
      color: "text-fg-muted",
      bg: "bg-ink-600/40 border-white/10",
      href: "/ong/pets",
    },
    {
      label: "Vacinas (próx. 30 dias)",
      value: vaccineDueCount,
      sub: "Doses vencidas ou a vencer",
      icon: Syringe,
      color: vaccineDueCount > 0 ? "text-brand-400" : "text-fg-muted",
      bg: vaccineDueCount > 0 ? "bg-brand-500/10 border-brand-500/30" : "bg-ink-600/40 border-white/10",
      alert: vaccineDueCount > 0,
      href: "/ong/pets",
    },
    {
      label: "Estado crítico",
      value: criticalPets ?? 0,
      sub: "Precisam de atenção urgente",
      icon: AlertTriangle,
      color: (criticalPets ?? 0) > 0 ? "text-danger" : "text-fg-muted",
      bg: (criticalPets ?? 0) > 0 ? "bg-danger/10 border-danger/30" : "bg-ink-600/40 border-white/10",
      alert: (criticalPets ?? 0) > 0,
      href: "/ong/pets?health=critical",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Visão geral</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {shelter.name} — dados em tempo real.
        </p>
      </div>

      {/* Banner de alertas */}
      {hasAlerts && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 space-y-1">
          {(criticalPets ?? 0) > 0 && (
            <p className="text-sm text-fg">
              ⚠️ <strong>{criticalPets}</strong> pet(s) em estado crítico.
            </p>
          )}
          {vaccineDueCount > 0 && (
            <p className="text-sm text-fg">
              💉 <strong>{vaccineDueCount}</strong> vacina(s) vencendo nos próximos 30 dias.
            </p>
          )}
          {followUpCount > 0 && (
            <p className="text-sm text-fg">
              📋 <strong>{followUpCount}</strong> acompanhamento(s) pós-adoção pendente(s).
            </p>
          )}
        </div>
      )}

      {/* Estado vazio — nenhum pet cadastrado */}
      {(totalPets ?? 0) === 0 && (adoptedPets ?? 0) === 0 && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-6 text-center">
          <p className="text-2xl">🐾</p>
          <p className="mt-2 font-display text-lg font-bold text-fg">Nenhum pet cadastrado ainda</p>
          <p className="mt-1 text-sm text-fg-muted">
            Comece registrando os animais do seu abrigo para acompanhar saúde, vacinas e adoções.
          </p>
          <Link
            href="/ong/pets/novo"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
          >
            + Cadastrar primeiro pet
          </Link>
        </div>
      )}

      {/* Cards de métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, sub, icon: Icon, color, bg, alert, href }) => (
          <Link
            key={label}
            href={href}
            className={`relative rounded-xl border p-5 transition hover:brightness-110 ${bg}`}
          >
            {alert && (
              <span className="absolute right-3 top-3 h-2 w-2 animate-pulse rounded-full bg-brand-500" />
            )}
            <Icon className={`mb-3 h-6 w-6 ${color}`} />
            <p className="font-display text-3xl font-bold text-fg">{value}</p>
            <p className="mt-0.5 text-sm font-medium text-fg">{label}</p>
            <p className="mt-1 text-xs text-fg-muted">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Últimos 5 pets resgatados */}
        {recentPets && recentPets.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">Últimos resgatados</h2>
              <Link href="/ong/pets" className="text-xs text-fg-muted hover:text-fg">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-2.5">
              {recentPets.map((pet) => (
                <Link
                  key={pet.id}
                  href={`/ong/pets/${pet.id}`}
                  className="flex items-center gap-3 rounded-lg bg-ink-600/40 px-3 py-2.5 transition hover:bg-ink-600/70"
                >
                  <span className="text-xl">
                    {pet.species === "dog" ? "🐶" : pet.species === "cat" ? "🐱" : "🐾"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {pet.name ?? "Sem nome"}
                      {pet.is_castrated && (
                        <span className="ml-1.5 text-[10px] font-bold text-cyan-400">✓ Castrado</span>
                      )}
                    </p>
                    <p className="text-xs text-fg-subtle">
                      {new Date(pet.rescue_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${HEALTH_COLOR[pet.health_status]}`}>
                      {HEALTH_LABEL[pet.health_status]}
                    </span>
                    <span className="text-[10px] text-fg-subtle">{STATUS_LABEL[pet.status]}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Vacinas vencendo */}
        {vaccinesDue && vaccinesDue.length > 0 && (
          <div className="rounded-xl border border-brand-500/20 bg-ink-700/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">💉 Vacinas (próx. 30 dias)</h2>
            </div>
            <div className="space-y-2.5">
              {vaccinesDue.map((v) => {
                
                const petName = v.shelter_pets?.name ?? "Sem nome";
                const isOverdue = v.next_dose_date! <= today;
                return (
                  <Link
                    key={v.id}
                    href={`/ong/pets/${v.pet_id}/vacinas`}
                    className="flex items-center gap-3 rounded-lg bg-ink-600/40 px-3 py-2.5 transition hover:bg-ink-600/70"
                  >
                    <span className="text-xl">💉</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{petName}</p>
                      <p className="text-xs text-fg-subtle">{v.vaccine_name}</p>
                    </div>
                    <span className={`text-xs font-bold ${isOverdue ? "text-danger" : "text-brand-300"}`}>
                      {isOverdue ? "⚠️ Atrasada" : new Date(v.next_dose_date!).toLocaleDateString("pt-BR")}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Acompanhamentos pendentes */}
        {followUpDue && followUpDue.length > 0 && (
          <div className="rounded-xl border border-cyan-500/20 bg-ink-700/50 p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">📋 Acompanhamentos pendentes</h2>
              <Link href="/ong/adocoes" className="text-xs text-fg-muted hover:text-fg">
                Ver todos →
              </Link>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {followUpDue.map((adoption) => {
                
                const petName = adoption.shelter_pets?.name ?? "Sem nome";
                
                const petSpecies = adoption.shelter_pets?.species;
                const emoji = petSpecies === "dog" ? "🐶" : petSpecies === "cat" ? "🐱" : "🐾";
                const f30overdue = adoption.follow_up_30_date && adoption.follow_up_30_date <= today;
                const f90overdue = adoption.follow_up_90_date && adoption.follow_up_90_date <= today;
                return (
                  <Link
                    key={adoption.id}
                    href={`/ong/adocoes/${adoption.id}`}
                    className="flex items-center gap-3 rounded-lg bg-ink-600/40 px-3 py-2.5 transition hover:bg-ink-600/70"
                  >
                    <span className="text-xl">{emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        {petName} → {adoption.adopter_name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-2 text-[11px]">
                        {adoption.follow_up_30_date && (
                          <span className={f30overdue ? "font-bold text-danger" : "text-fg-subtle"}>
                            {f30overdue ? "⚠️ " : ""}30d: {new Date(adoption.follow_up_30_date).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        {adoption.follow_up_90_date && (
                          <span className={f90overdue ? "font-bold text-brand-300" : "text-fg-subtle"}>
                            {f90overdue ? "⚠️ " : ""}90d: {new Date(adoption.follow_up_90_date).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
