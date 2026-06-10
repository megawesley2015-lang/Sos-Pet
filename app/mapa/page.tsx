import { TopBar } from "@/components/layout/TopBar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PetMapPin, SentinelPin, SightingPin } from "@/components/maps/PetAlertMap";
import { MapaClient } from "./MapaClient";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapa de Alertas",
  description:
    "Mapa em tempo real com pets perdidos e encontrados na sua região. Veja alfinetes de alertas ativos e câmeras da Rede Sentinela.",
  alternates: { canonical: "/mapa" },
  openGraph: {
    title: "Mapa de Alertas · SOS Pet",
    description: "Monitoramento em tempo real de pets perdidos e encontrados perto de você.",
    url: "/mapa",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const supabase = await createSupabaseServerClient();

  const { data: petsRaw } = await supabase
    .from("pets_public")
    .select("id, kind, name, species, color, photo_url, latitude, longitude, city, neighborhood, created_at")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: sightingsRaw } = await supabase
    .from("sightings")
    .select("id, pet_id, lat, lng, description, created_at")
    .gte("created_at", twoWeeksAgo)
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: sentinelsRaw } = await supabase
    .from("sentinel_partners")
    .select("id, name, type, latitude, longitude, address, has_cameras")
    .eq("is_active", true)
    .limit(200);

  const pets: PetMapPin[] = (petsRaw ?? []).map((p) => ({
    id:           p.id as string,
    kind:         p.kind as "lost" | "found",
    name:         p.name as string | null,
    species:      p.species as string,
    color:        p.color as string,
    photo_url:    p.photo_url as string | null,
    latitude:     Number(p.latitude),
    longitude:    Number(p.longitude),
    city:         p.city as string,
    neighborhood: p.neighborhood as string,
    created_at:   p.created_at as string,
  }));

  const sentinels: SentinelPin[] = (sentinelsRaw ?? []).map((s) => ({
    id:          s.id as string,
    name:        s.name as string,
    type:        s.type as string,
    latitude:    Number(s.latitude),
    longitude:   Number(s.longitude),
    address:     s.address as string,
    has_cameras: s.has_cameras as boolean,
  }));

  const sightings: SightingPin[] = (sightingsRaw ?? []).map((s) => ({
    id:          s.id as string,
    pet_id:      s.pet_id as string,
    lat:         s.lat as number,
    lng:         s.lng as number,
    description: s.description as string | null,
    created_at:  s.created_at as string,
  }));

  const lostCount  = pets.filter((p) => p.kind === "lost").length;
  const foundCount = pets.filter((p) => p.kind === "found").length;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TopBar />

      <main className="flex flex-1 flex-col px-4 pb-4 pt-4">
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

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 font-bold text-brand-300">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              {lostCount} perdido{lostCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-[#20B2AA]/30 bg-[#E1F5EE] px-3 py-1.5 font-bold text-[#0F6E56]">
              <span className="h-2 w-2 rounded-full bg-[#20B2AA]" />
              {foundCount} encontrado{foundCount !== 1 ? "s" : ""}
            </span>
            {sentinels.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-warm-200 bg-warm-100 px-3 py-1.5 font-bold text-fg-muted">
                📷 {sentinels.length} câmera{sentinels.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {pets.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-warm-200 bg-warm-50 text-center p-12 shadow-warm-card">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="font-display text-xl font-bold text-fg mb-2">
              Mapa vazio por enquanto
            </h2>
            <p className="text-sm text-fg-muted max-w-sm">
              Os alfinetes aparecem aqui quando pets são registrados com localização GPS.
            </p>
            <Link
              href="/pets/novo"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow-brand hover:bg-brand-400"
            >
              Registrar pet
            </Link>
          </div>
        ) : (
          <div className="flex-1 min-h-[500px]">
            <MapaClient pets={pets} sentinels={sentinels} sightings={sightings} />
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-fg-subtle">
          <span>💡 Alfinetes laranjas pulsantes = alertas nas últimas 24h</span>
          <span>📷 Câmeras parceiras = estabelecimentos da Rede Sentinela</span>
          <Link href="/pets/novo" className="text-brand-600 hover:text-brand-500">
            + Registrar pet →
          </Link>
          <Link href="/avistamentos/novo" className="text-brand-500 hover:text-brand-400">
            + Reportar avistamento →
          </Link>
        </div>
      </main>
    </div>
  );
}
