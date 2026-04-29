"use client";

/**
 * Wrapper com dynamic import para o PetMap.
 * Necessário porque Leaflet acessa window/document e não funciona no servidor.
 */
import dynamic from "next/dynamic";
import type { SightingRow } from "@/lib/types/database";

const PetMap = dynamic(() => import("./PetMap"), {
  ssr: false,
  loading: () => (
    <div className="mt-4 flex h-[320px] items-center justify-center rounded-xl border border-white/10 bg-ink-800/40">
      <p className="text-sm text-fg-subtle">Carregando mapa…</p>
    </div>
  ),
});

export default function PetMapDynamic({
  sightings,
  petCity,
}: {
  sightings: SightingRow[];
  petCity?: string;
}) {
  return <PetMap sightings={sightings} petCity={petCity} />;
}
