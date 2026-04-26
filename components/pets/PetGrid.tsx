import { PetCard } from "./PetCard";
import type { PetRow } from "@/lib/types/database";

interface PetGridProps {
  pets: PetRow[];
}

export function PetGrid({ pets }: PetGridProps) {
  if (pets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-ink-700/40 p-10 text-center">
        <p className="text-sm font-medium text-fg">
          Nenhum pet encontrado com esses filtros
        </p>
        <p className="mt-1 text-xs text-fg-muted">
          Tente ajustar os filtros acima ou cadastre o primeiro registro.
        </p>
      </div>
    );
  }

  return (
    <div className="grid animate-fade-in grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}
    </div>
  );
}
