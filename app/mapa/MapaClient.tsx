"use client";

import dynamic from "next/dynamic";
import type { PetMapPin, SentinelPin, SightingPin } from "@/components/maps/PetAlertMap";

// ssr: false só pode ser usado em Client Components
const PetAlertMap = dynamic(
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

interface MapaClientProps {
  pets: PetMapPin[];
  sentinels: SentinelPin[];
  sightings: SightingPin[];
}

export function MapaClient({ pets, sentinels, sightings }: MapaClientProps) {
  return (
    <PetAlertMap
      pets={pets}
      sentinels={sentinels}
      sightings={sightings}
      height="100%"
      showFilters
    />
  );
}
