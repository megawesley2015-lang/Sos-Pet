import Link from "next/link";
import Image from "next/image";
import { MapPin, PawPrint } from "lucide-react";
import { SOSBadge } from "@/components/ui/SOSBadge";
import { formatRelativeDate, SPECIES_LABEL } from "@/lib/utils/format";
import type { PetRow } from "@/lib/types/database";

interface PetCardProps {
  pet: PetRow;
}

export function PetCard({ pet }: PetCardProps) {
  return (
    <Link
      href={`/pets/${pet.id}`}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-ink-700/70 backdrop-blur-sm transition-all hover:border-brand-500/40 hover:shadow-glow-brand"
    >
      {/* Imagem */}
      <div className="relative h-40 bg-gradient-to-br from-ink-600 to-ink-900">
        {pet.photo_url ? (
          <Image
            src={pet.photo_url}
            alt={pet.name ?? "Pet"}
            fill
            sizes="(max-width: 768px) 50vw, 300px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PawPrint
              className="h-12 w-12 text-brand-500/40"
              strokeWidth={1.5}
            />
          </div>
        )}
        {/* Overlay sutil */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/60 via-transparent to-transparent" />
        {/* Badge */}
        <div className="absolute left-2 top-2 z-10">
          <SOSBadge kind={pet.kind} />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              pet.kind === "lost"
                ? "bg-brand-500 shadow-glow-brand"
                : "bg-cyan-500 shadow-glow-cyan"
            }`}
          />
          <h3 className="truncate text-sm font-bold text-fg">
            {pet.name ?? "Sem nome"}
          </h3>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-fg-subtle">
            {SPECIES_LABEL[pet.species]}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-fg-muted">
          <MapPin className="h-3 w-3 text-brand-500" strokeWidth={2} />
          <span className="truncate">
            {pet.neighborhood}, {pet.city}
          </span>
        </div>

        <p className="mt-1 font-display text-[10px] tracking-wide text-fg-subtle">
          {formatRelativeDate(pet.event_date)}
        </p>
      </div>
    </Link>
  );
}
