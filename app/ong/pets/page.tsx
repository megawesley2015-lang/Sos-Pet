import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, PawPrint, Filter } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import type { ShelterPetStatus, HealthStatus, PetSpecies } from "@/lib/types/database";

export const revalidate = 0; // sempre fresco — lista muda com frequência

export const metadata = { title: "Pets — Painel ONG" };

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

const STATUS_LABEL: Record<ShelterPetStatus, string> = {
  available: "Disponível",
  fostered: "Lar temp.",
  adopted: "Adotado",
  deceased: "Falecido",
};

const STATUS_COLOR: Record<ShelterPetStatus, string> = {
  available: "text-cyan-300",
  fostered: "text-brand-300",
  adopted: "text-success",
  deceased: "text-fg-subtle",
};

const SPECIES_ICON: Record<PetSpecies, string> = {
  dog: "🐶",
  cat: "🐱",
  other: "🐾",
};

interface SearchParams {
  status?: ShelterPetStatus;
  health?: HealthStatus;
  species?: PetSpecies;
  castrated?: "true" | "false";
  order?: "rescue_asc" | "rescue_desc" | "name_asc" | "health";
}

// Prioridade de exibição por situação de saúde (mais crítico primeiro)
const HEALTH_PRIORITY: Record<HealthStatus, number> = {
  critical: 0,
  recovering: 1,
  treated: 2,
  healthy: 3,
};

export default async function OngPetsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login?next=/ong/pets");

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shelter) redirect("/ong/cadastro");

  const params = await searchParams;
  const { status, health, species, castrated, order = "rescue_desc" } = params;

  let query = supabase
    .from("shelter_pets")
    .select("id, name, species, breed, color, size, sex, health_status, status, rescue_date, rescue_location, photo_url, estimated_age, is_castrated")
    .eq("shelter_id", shelter.id);

  if (status) query = query.eq("status", status);
  if (health) query = query.eq("health_status", health);
  if (species) query = query.eq("species", species);
  if (castrated === "true") query = query.eq("is_castrated", true);
  if (castrated === "false") query = query.eq("is_castrated", false);

  // Para order=health, busca tudo e ordena em memória com mapa de prioridade
  if (order === "rescue_asc") query = query.order("rescue_date", { ascending: true });
  else if (order === "name_asc") query = query.order("name", { ascending: true, nullsFirst: false });
  else if (order !== "health") query = query.order("rescue_date", { ascending: false });

  const { data: rawPets } = await query;

  // Ordenação por situação de saúde: feita em memória
  const pets =
    order === "health"
      ? [...(rawPets ?? [])].sort(
          (a, b) =>
            (HEALTH_PRIORITY[a.health_status as HealthStatus] ?? 99) -
            (HEALTH_PRIORITY[b.health_status as HealthStatus] ?? 99)
        )
      : rawPets;

  const buildFilter = (key: string, value: string) => {
    const p = new URLSearchParams(params as Record<string, string>);
    if (p.get(key) === value) p.delete(key);
    else p.set(key, value);
    return `/ong/pets?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Pets</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {pets?.length ?? 0} pet(s) encontrado(s)
          </p>
        </div>
        <Link
          href="/ong/pets/novo"
          className="ml-auto flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow-brand transition hover:bg-brand-400"
        >
          <Plus className="h-4 w-4" />
          Cadastrar pet
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-ink-700/30 p-3">
        <Filter className="h-4 w-4 shrink-0 self-center text-fg-subtle" />

        {/* Status */}
        {(["available", "fostered", "adopted", "deceased"] as ShelterPetStatus[]).map((s) => (
          <Link
            key={s}
            href={buildFilter("status", s)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
              status === s
                ? "border-cyan-500 bg-cyan-500/20 text-cyan-200"
                : "border-white/10 bg-ink-600/40 text-fg-muted hover:border-white/20"
            }`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}

        <span className="mx-1 text-white/20">|</span>

        {/* Saúde */}
        {(["healthy", "recovering", "critical", "treated"] as HealthStatus[]).map((h) => (
          <Link
            key={h}
            href={buildFilter("health", h)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
              health === h
                ? "border-brand-500 bg-brand-500/20 text-brand-200"
                : "border-white/10 bg-ink-600/40 text-fg-muted hover:border-white/20"
            }`}
          >
            {HEALTH_LABEL[h]}
          </Link>
        ))}

        <span className="mx-1 text-white/20">|</span>

        {/* Espécie */}
        {(["dog", "cat", "other"] as PetSpecies[]).map((sp) => (
          <Link
            key={sp}
            href={buildFilter("species", sp)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
              species === sp
                ? "border-cyan-500 bg-cyan-500/20 text-cyan-200"
                : "border-white/10 bg-ink-600/40 text-fg-muted hover:border-white/20"
            }`}
          >
            {SPECIES_ICON[sp]}
          </Link>
        ))}

        <span className="mx-1 text-white/20">|</span>

        {/* Castrado */}
        {(["true", "false"] as const).map((v) => (
          <Link
            key={v}
            href={buildFilter("castrated", v)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
              castrated === v
                ? "border-cyan-500 bg-cyan-500/20 text-cyan-200"
                : "border-white/10 bg-ink-600/40 text-fg-muted hover:border-white/20"
            }`}
          >
            {v === "true" ? "✓ Castrado" : "✗ Não castrado"}
          </Link>
        ))}

        <span className="mx-1 text-white/20">|</span>

        {/* Ordenação */}
        {(["rescue_desc", "rescue_asc", "health", "name_asc"] as const).map((o) => {
          const labels = {
            rescue_desc: "Mais recente",
            rescue_asc: "Mais antigo",
            health: "Por saúde",
            name_asc: "Nome A-Z",
          };
          return (
            <Link
              key={o}
              href={buildFilter("order", o)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                (order ?? "rescue_desc") === o
                  ? "border-white/30 bg-ink-500 text-fg"
                  : "border-white/10 bg-ink-600/40 text-fg-muted hover:border-white/20"
              }`}
            >
              {labels[o]}
            </Link>
          );
        })}
      </div>

      {/* Grid de pets */}
      {!pets || pets.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/10 bg-ink-700/20 py-16">
          <PawPrint className="h-12 w-12 text-fg-subtle/40" strokeWidth={1} />
          <p className="text-sm text-fg-muted">Nenhum pet encontrado.</p>
          <Link
            href="/ong/pets/novo"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white"
          >
            Cadastrar primeiro pet
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <Link
              key={pet.id}
              href={`/ong/pets/${pet.id}`}
              className="group rounded-xl border border-white/5 bg-ink-700/60 p-4 transition hover:border-cyan-500/30 hover:shadow-glow-cyan"
            >
              {/* Topo: emoji + nome + badges */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-600 text-xl">
                  {SPECIES_ICON[pet.species as PetSpecies] ?? "🐾"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">
                    {pet.name ?? "Sem nome"}
                  </p>
                  <p className="text-xs text-fg-subtle">
                    {pet.breed ?? pet.color}
                    {pet.is_castrated && (
                      <span className="ml-1.5 font-bold text-cyan-400">· Castrado</span>
                    )}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                    HEALTH_COLOR[pet.health_status as HealthStatus]
                  }`}
                >
                  {HEALTH_LABEL[pet.health_status as HealthStatus]}
                </span>
              </div>

              {/* Info */}
              <div className="mt-3 flex items-center justify-between text-xs text-fg-muted">
                <span>
                  Resgate:{" "}
                  {new Date(pet.rescue_date).toLocaleDateString("pt-BR")}
                </span>
                <span className={`font-bold ${STATUS_COLOR[pet.status as ShelterPetStatus]}`}>
                  {STATUS_LABEL[pet.status as ShelterPetStatus]}
                </span>
              </div>

              {pet.rescue_location && (
                <p className="mt-1 truncate text-xs text-fg-subtle">
                  📍 {pet.rescue_location}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
