"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { PetMapPin } from "./PetAlertMap";
import { HeroMap } from "./HeroMap";
import { SearchFloatingBar } from "./SearchFloatingBar";
import { PetHorizontalCarousel } from "./PetHorizontalCarousel";

interface MapContainerProps {
  pets: PetMapPin[];
  locationStats: Array<{ city: string; lost: number; found: number }>;
}

export function MapContainer({ pets, locationStats }: MapContainerProps) {
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<any>(null);

  const filteredPets = pets.filter((pet) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      pet.city.toLowerCase().includes(query) ||
      pet.neighborhood.toLowerCase().includes(query)
    );
  });

  const handleSelectPet = useCallback((petId: string) => {
    setSelectedPetId(petId);
  }, []);

  useEffect(() => {
    if (!selectedPetId || !mapRef.current) return;

    const selectedPet = filteredPets.find((pet) => pet.id === selectedPetId);
    if (selectedPet && mapRef.current.panToLocation) {
      mapRef.current.panToLocation(selectedPet.latitude, selectedPet.longitude);
    }
  }, [selectedPetId, filteredPets]);

  return (
    <div className="relative w-full bg-ink-900" style={{ height: "500px" }}>
      {/* ── Mapa como background ── */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/12 bg-ink-800">
        {filteredPets.length > 0 ? (
          <HeroMap ref={mapRef} pets={filteredPets} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-xs text-fg-subtle">
              Nenhum pet encontrado com esses critérios.
            </p>
          </div>
        )}
      </div>

      {/* ── Barra de busca flutuante (topo) ── */}
      <SearchFloatingBar
        locationStats={locationStats}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ── Carrossel flutuante (fundo) ── */}
      <PetHorizontalCarousel
        pets={filteredPets}
        selectedPetId={selectedPetId}
        onSelectPet={handleSelectPet}
      />
    </div>
  );
}
