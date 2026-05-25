"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils/format";

export interface AlertPet {
  id: string;
  kind: "lost" | "found";
  name: string | null;
  species: string;
  color: string;
  photo_url: string | null;
  neighborhood: string;
  city: string;
  created_at: string;
}

interface PetAlertFeedProps {
  pets: AlertPet[];
}

const SPECIES_LABEL: Record<string, string> = {
  dog: "Cão",
  cat: "Gato",
  other: "Animal",
};

const PLACEHOLDER_PETS: AlertPet[] = [
  {
    id: "ph1",
    kind: "lost",
    name: "Max",
    species: "dog",
    color: "Caramelo",
    photo_url: null,
    neighborhood: "Gonzaga",
    city: "Santos",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ph2",
    kind: "found",
    name: null,
    species: "cat",
    color: "Cinza",
    photo_url: null,
    neighborhood: "Pinheiros",
    city: "São Paulo",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ph3",
    kind: "lost",
    name: "Luna",
    species: "dog",
    color: "Dourado",
    photo_url: null,
    neighborhood: "Enseada",
    city: "Guarujá",
    created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ph4",
    kind: "lost",
    name: "Mel",
    species: "cat",
    color: "Laranja",
    photo_url: null,
    neighborhood: "Boqueirão",
    city: "Santos",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ph5",
    kind: "found",
    name: null,
    species: "dog",
    color: "Preto e branco",
    photo_url: null,
    neighborhood: "Centro",
    city: "Santo André",
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
];

const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐶",
  cat: "🐱",
  other: "🐾",
};

function PetCard({ pet, isPlaceholder = false }: { pet: AlertPet; isPlaceholder?: boolean }) {
  const isLost = pet.kind === "lost";
  const label = isLost ? "PERDIDO" : "ENCONTRADO";
  const accentColor = isLost ? "#f97316" : "#22d3ee";
  const bgColor = isLost ? "rgba(249,115,22,0.12)" : "rgba(34,211,238,0.12)";
  const emoji = SPECIES_EMOJI[pet.species] ?? "🐾";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-white/8 bg-ink-800/70 p-3 transition-all hover:border-white/16 hover:bg-ink-800 ${
        isPlaceholder ? "opacity-60 blur-[1px]" : ""
      }`}
    >
      {/* Foto / avatar */}
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-lg"
        style={{ width: 60, height: 60 }}
      >
        {pet.photo_url ? (
          <img
            src={pet.photo_url}
            alt={pet.name ?? pet.species}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-2xl"
            style={{ background: bgColor }}
          >
            {emoji}
          </div>
        )}
        {/* Pulse para pets perdidos */}
        {isLost && !isPlaceholder && (
          <span
            className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full"
            style={{
              background: accentColor,
              boxShadow: `0 0 0 0 ${accentColor}`,
              animation: "alertPulse 2s ease-out infinite",
            }}
          />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wider"
            style={{ background: bgColor, color: accentColor }}
          >
            {label}
          </span>
          <span className="text-[10px] text-fg-subtle ml-auto tabular-nums">
            {formatRelativeDate(pet.created_at)}
          </span>
        </div>

        <p className="mt-1 truncate text-sm font-bold text-fg leading-tight">
          {pet.name
            ? `${pet.name} · ${SPECIES_LABEL[pet.species] ?? "Animal"}`
            : `${SPECIES_LABEL[pet.species] ?? "Animal"} ${emoji}`}
        </p>

        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-fg-subtle">
          <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
          <span className="truncate">
            {pet.neighborhood}, {pet.city}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PetAlertFeed({ pets }: PetAlertFeedProps) {
  const isEmpty = pets.length === 0;
  const items = isEmpty ? PLACEHOLDER_PETS : pets;

  // Duplica para loop infinito (precisa de pelo menos 2 cópias)
  const looped = items.length < 5 ? [...items, ...items, ...items] : [...items, ...items];

  // Duração proporcional ao número de items — ~2s por card
  const duration = Math.max(items.length * 2.2, 8);

  const feedRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Pausa ao hover
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const onEnter = () => setPaused(true);
    const onLeave = () => setPaused(false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const lostCount = pets.filter((p) => p.kind === "lost").length;
  const foundCount = pets.filter((p) => p.kind === "found").length;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full bg-brand-500"
            style={{ animation: "alertPulse 1.5s ease-out infinite" }}
          />
          <span className="text-[11px] font-bold uppercase tracking-widest text-fg-muted">
            Alertas recentes
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-fg-subtle">
          {!isEmpty && (
            <>
              <span>
                <span className="font-bold text-brand-400">{lostCount}</span> perdidos
              </span>
              <span>
                <span className="font-bold text-cyan-400">{foundCount}</span> encontrados
              </span>
            </>
          )}
        </div>
      </div>

      {/* Feed com scroll automático */}
      <div
        ref={feedRef}
        className="relative flex-1 overflow-hidden rounded-xl border border-white/8"
        style={{ minHeight: 0 }}
      >
        {/* Fade top/bottom */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 z-10 bg-gradient-to-b from-ink-900 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 z-10 bg-gradient-to-t from-ink-900 to-transparent" />

        <div
          className="flex flex-col gap-2 px-2 py-2"
          style={{
            animation: `feedScroll ${duration}s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {looped.map((pet, i) =>
            isEmpty ? (
              <PetCard key={`${pet.id}-${i}`} pet={pet} isPlaceholder />
            ) : (
              <Link key={`${pet.id}-${i}`} href={`/pets/${pet.id}`} className="block">
                <PetCard pet={pet} />
              </Link>
            )
          )}
        </div>

        {/* Overlay "Seja o primeiro" para estado vazio */}
        {isEmpty && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-ink-900/60 backdrop-blur-[2px]">
            <p className="text-sm font-bold text-fg">Nenhum alerta ainda</p>
            <p className="text-xs text-fg-subtle text-center px-6">
              Seja o primeiro a cadastrar um pet perdido ou encontrado na rede.
            </p>
            <Link
              href="/pets/novo"
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white"
            >
              Cadastrar agora
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Rodapé: link para o mapa */}
      <Link
        href="/mapa"
        className="flex items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-ink-800/50 py-2.5 text-xs font-bold text-fg-muted transition-all hover:border-white/16 hover:text-fg"
      >
        <MapPin className="h-3.5 w-3.5" />
        Ver mapa completo
        <ArrowRight className="h-3 w-3" />
      </Link>

      {/* CSS de animação */}
      <style>{`
        @keyframes feedScroll {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes alertPulse {
          0%   { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
          70%  { box-shadow: 0 0 0 6px transparent; opacity: 0.6; }
          100% { box-shadow: 0 0 0 0 transparent; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
