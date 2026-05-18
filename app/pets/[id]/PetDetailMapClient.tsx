"use client";

import dynamic from "next/dynamic";

const PetDetailMap = dynamic(
  () => import("@/components/maps/PetDetailMap").then((m) => ({ default: m.PetDetailMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl border border-white/10 bg-ink-900 text-fg-subtle text-sm">
        Carregando mapa…
      </div>
    ),
  }
);

interface SightingPoint {
  lat: number;
  lng: number;
  description: string | null;
  created_at: string;
}

interface Props {
  petId: string;
  petName?: string | null;
  species: string;
  kind: "lost" | "found";
  latitude: number;
  longitude: number;
  sightings: SightingPoint[];
  showMetaPanel?: boolean;
}

export function PetDetailMapClient(props: Props) {
  return <PetDetailMap {...props} />;
}
