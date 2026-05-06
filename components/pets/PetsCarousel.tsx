"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import type { PetRow } from "@/lib/types/database";

const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐕",
  cat: "🐈",
  other: "🐾",
};

interface Props {
  pets: Pick<PetRow, "id" | "name" | "species" | "photo_url" | "neighborhood" | "city" | "event_date">[];
}

/**
 * Carrossel automático de pets perdidos.
 * Auto-avança a cada 4s, pausa no hover, navegação manual por botões.
 */
export function PetsCarousel({ pets }: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const total = pets.length;

  // Quantos cards visíveis dependem do viewport — gerenciado por CSS grid
  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % total);
    }, 4000);
    return () => clearInterval(id);
  }, [paused, total]);

  // Scroll suave do track para o card ativo
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[idx] as HTMLElement | undefined;
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [idx]);

  if (!total) return null;

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Track */}
      <div
        ref={trackRef}
        className="scrollbar-none flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {pets.map((pet, i) => (
          <Link
            key={pet.id}
            href={`/pets/${pet.id}`}
            style={{ scrollSnapAlign: "start" }}
            className={`group relative flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border transition-all duration-300 sm:w-48
              ${i === idx
                ? "border-brand-500/60 shadow-glow-brand ring-1 ring-brand-500/30 scale-[1.02]"
                : "border-white/10 hover:border-white/25"
              } bg-ink-700/60`}
          >
            {/* Foto quadrada 1:1 */}
            <div className="relative aspect-square w-full bg-ink-600 overflow-hidden">
              {pet.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pet.photo_url}
                  alt={pet.name ?? "Pet"}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">
                  {SPECIES_EMOJI[pet.species] ?? "🐾"}
                </div>
              )}
              {/* Badge vermelho "Perdido" */}
              <div className="absolute left-2 top-2 rounded-full bg-danger px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white shadow">
                Perdido
              </div>
            </div>

            {/* Info */}
            <div className="p-2.5">
              <p className="truncate font-display text-xs font-bold text-fg">
                {pet.name ?? "Sem nome"}
              </p>
              <p className="mt-0.5 flex items-center gap-0.5 truncate text-[10px] text-fg-muted">
                <MapPin className="h-2.5 w-2.5 shrink-0 text-brand-500" />
                {pet.neighborhood}, {pet.city}
              </p>
              <p className="mt-0.5 text-[10px] text-fg-subtle">
                {new Date(pet.event_date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Botões de navegação */}
      {total > 3 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Anterior"
            className="absolute -left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-ink-800/90 shadow-lg backdrop-blur-sm hover:border-brand-500/50 hover:text-brand-400"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Próximo"
            className="absolute -right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-ink-800/90 shadow-lg backdrop-blur-sm hover:border-brand-500/50 hover:text-brand-400"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="mt-3 flex justify-center gap-1">
          {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Pet ${i + 1}`}
              className={`rounded-full transition-all ${
                i === idx % Math.min(total, 8)
                  ? "w-4 bg-brand-500"
                  : "w-1.5 bg-white/20 hover:bg-white/40"
              } h-1.5`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
