"use client";

import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import type { PetMapPin } from "./PetAlertMap";

interface PetHorizontalCarouselProps {
  pets: PetMapPin[];
  selectedPetId: string | null;
  onSelectPet: (petId: string) => void;
}

export function PetHorizontalCarousel({
  pets,
  selectedPetId,
  onSelectPet,
}: PetHorizontalCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(pets.length > 3);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    };

    checkScroll();
    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [pets.length]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 320; // card width + gap
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (pets.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-ink-900 via-ink-900/90 to-transparent px-4 py-4">
      <div className="relative mx-auto max-w-5xl">
        {/* Scroll buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-ink-800/80 p-2 backdrop-blur transition hover:bg-ink-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-ink-800/80 p-2 backdrop-blur transition hover:bg-ink-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Carousel container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scroll-smooth px-10 pb-2 scrollbar-hide"
        >
          {pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => onSelectPet(pet.id)}
              className={`group relative shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                selectedPetId === pet.id
                  ? "border-brand-500 shadow-lg shadow-brand-500/50"
                  : "border-white/12 hover:border-white/30"
              }`}
              style={{ width: "280px", height: "140px" }}
            >
              {/* Background image */}
              {pet.photo_url && (
                <img
                  src={pet.photo_url}
                  alt={pet.name || pet.species}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent" />

              {/* Content */}
              <div className="relative flex h-full flex-col justify-between p-3">
                {/* Status badge */}
                <div className="flex justify-between items-start">
                  <div
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold backdrop-blur-sm"
                    style={{
                      backgroundColor:
                        pet.kind === "lost"
                          ? "rgba(249, 115, 22, 0.2)"
                          : "rgba(34, 211, 238, 0.2)",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          pet.kind === "lost" ? "#f97316" : "#22d3ee",
                      }}
                    />
                    <span
                      style={{
                        color:
                          pet.kind === "lost" ? "#fed7aa" : "#cffafe",
                      }}
                    >
                      {pet.kind === "lost" ? "Perdido" : "Encontrado"}
                    </span>
                  </div>
                </div>

                {/* Name and location */}
                <div className="text-left">
                  <p className="text-sm font-bold text-white truncate">
                    {pet.name || pet.species}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-fg-subtle">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {pet.neighborhood}, {pet.city}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
