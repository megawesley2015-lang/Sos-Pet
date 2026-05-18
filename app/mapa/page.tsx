import nextDynamic from "next/dynamic";
import { TopBar } from "@/components/layout/TopBar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PetMapPin, SentinelPin, SightingPin } from "@/components/maps/PetAlertMap";

export const dynamic = "force-dynamic";

// Leaflet depende de window → SSR desabilitado
const PetAlertMap = nextDynamic(
  () => import("@/components/maps/PetAlertMap").then((m) => ({ default: m.PetAlertMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-ink-900">
        <div className="text-center text-fg-subtle">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-sm">Inicializando rede de monitoramento…</p>
        </div>
      </div>
    ),
  }
);

export default async function MapaPage() {
  const supabase = await createSupabaseServerClient();

  // Busca todos os pets ativos com lat/lng
  const { data: petsRaw } = await supabase
    .from("pets_public")
    .select("id, kind, name, species, color, photo_url, latitude, longitude, city, neighborhood, created_at")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  // Avistamentos das últimas 2 semanas
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: sightingsRaw } = await supabase
    .from("sightings")
    .select("id, pet_id, lat, lng, description, created_at")
    .gte("created_at", twoWeeksAgo)
    .order("created_at", { ascending: false })
    .limit(200);

  // Câmeras parceiras (sentinelas)
  const { data: sentinelsRaw } = await supabase
    .from("sentinel_partners")
    .select("id, name, type, latitude, longitude, address, has_cameras")
    .eq("is_active", true)
    .limit(200);

  const pets: PetMapPin[] = (petsRaw ?? []).map((p: any) => ({
    id:           p.id,
    kind:         p.kind,
    name:         p.name,
    species:      p.species,
    color:        p.color,
    photo_url:    p.photo_url,
    latitude:     Number(p.latitude),
    longitude:    Number(p.longitude),
    city:         p.city,
    neighborhood: p.neighborhood,
    created_at:   p.created_at,
  }));

  const sentinels: SentinelPin[] = (sentinelsRaw ?? []).map((s: any) => ({
    id:          s.id,
    name:        s.name,
    type:        s.type,
    latitude:    Number(s.latitude),
    longitude:   Number(s.longitude),
    address:     s.address,
    has_cameras: s.has_cameras,
  }));

  const sightings: SightingPin[] = (sightingsRaw ?? []).map((s: any) => ({
    id:          s.id,
    pet_id:      s.pet_id,
    lat:         s.lat,
    lng:         s.lng,
    description: s.description,
    created_at:  s.created_at,
  }));

  const lostCount  = pets.filter((p) => p.kind === "lost").length;
  const foundCount = pets.filter((p) => p.kind === "found").length;

  return (
    <div className="flex min-h-screen flex-col bg-ink-900">
      <TopBar />

      <main className="flex flex-1 flex-col px-4 pb-4 pt-4">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-fg">
              Mapa de{" "}
              <span className="text-brand-500 glow-text-brand">Alertas</span>
            </h1>
            <p className="mt-0.5 text-sm text-fg-muted">
              Rede de monitoramento em tempo real · {pets.length} alfinete{pets.length !== 1 ? "s" : ""} ativos
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 font-bold text-brand-300">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              {lostCount} perdido{lostCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-bold text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              {foundCount} encontrado{foundCount !== 1 ? "s" : ""}
            </span>
            {sentinels.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-700 px-3 py-1.5 font-bold text-fg-muted">
                📷 {sentinels.length} câmera{sentinels.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {pets.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-white/10 bg-ink-800 text-center p-12">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="font-display text-xl font-bold text-fg mb-2">
              Mapa vazio por enquanto
            </h2>
            <p className="text-sm text-fg-muted max-w-sm">
              Os alfinetes aparecem aqui quando pets são registrados com localização GPS.
              Cadastre o primeiro!
            </p>
            <a
              href="/pets/novo"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow-brand hover:bg-brand-400"
            >
              Registrar pet
            </a>
          </div>
        ) : (
          <div className="flex-1 min-h-[500px]">
            <PetAlertMap
              pets={pets}
              sentinels={sentinels}
              sightings={sightings}
              height="100%"
              showFilters
            />
          </div>
        )}

        {/* Info rodapé */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-fg-subtle">
          <span>
            💡 Alfinetes laranjas pulsantes = alertas nas últimas 24h
          </span>
          <span>
            📷 Câmeras parceiras = estabelecimentos da Rede Sentinela
          </span>
          <a href="/pets/novo" className="text-brand-400 hover:text-brand-300">
            + Registrar pet →
          </a>
          <a href="/avistamentos/novo" className="text-cyan-400 hover:text-cyan-300">
            + Reportar avistamento →
          </a>
        </div>
      </main>
    </div>
  );
}
