"use client";

import dynamic from "next/dynamic";
import type { PetMapPin } from "./PetAlertMap";

const PetAlertMap = dynamic(
  () => import("./PetAlertMap").then((m) => ({ default: m.PetAlertMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-white/10 bg-ink-800 text-xs text-fg-subtle">
        Carregando mapa…
      </div>
    ),
  }
);

interface HeroMapProps {
  pets: PetMapPin[];
}

/**
 * Wrapper client-side do PetAlertMap para uso no Hero da landing.
 * Sem SSR (Leaflet é client-only). Sem controles de filtro.
 */
export function HeroMap({ pets }: HeroMapProps) {
  return (
    <PetAlertMap
      pets={pets}
      height="100%"
      zoom={11}
      showFilters={false}
    />
  );
}
