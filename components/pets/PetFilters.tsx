"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { MapPin } from "lucide-react";
import { FilterChip } from "@/components/ui/FilterChip";

/**
 * Filtros client-side que atualizam a URL (searchParams).
 * Server Component da listagem lê os params e filtra no Supabase.
 * Padrão "URL as state" — compartilhável, funciona com botão voltar.
 *
 * Filtros disponíveis:
 *  - kind:    lost | found
 *  - species: dog | cat | other
 *  - city:    qualquer cidade (GeoFilter Baixada Santista pré-definido)
 */

// Cidades da Baixada Santista — filtro geográfico pré-definido
const BAIXADA_SANTISTA = [
  "Santos",
  "São Vicente",
  "Guarujá",
  "Praia Grande",
  "Cubatão",
  "Bertioga",
  "Mongaguá",
  "Itanhaém",
  "Peruíbe",
];

export function PetFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentKind    = params.get("kind")    ?? "all";
  const currentSpecies = params.get("species") ?? "all";
  const currentCity    = params.get("city")    ?? "all";

  const update = (key: string, value: string) => {
    const sp = new URLSearchParams(params.toString());
    if (value === "all") {
      sp.delete(key);
    } else {
      sp.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="space-y-3">
      {/* Tipo */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip label="Todos"       active={currentKind === "all"}   onClick={() => update("kind", "all")} />
        <FilterChip label="Perdidos"    active={currentKind === "lost"}  variant="brand" onClick={() => update("kind", "lost")} />
        <FilterChip label="Encontrados" active={currentKind === "found"} variant="cyan"  onClick={() => update("kind", "found")} />
      </div>

      {/* Espécie */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip label="Qualquer espécie" active={currentSpecies === "all"}   onClick={() => update("species", "all")} />
        <FilterChip label="Cão"              active={currentSpecies === "dog"}   onClick={() => update("species", "dog")} />
        <FilterChip label="Gato"             active={currentSpecies === "cat"}   onClick={() => update("species", "cat")} />
        <FilterChip label="Outros"           active={currentSpecies === "other"} onClick={() => update("species", "other")} />
      </div>

      {/* GeoFilter — cidades da Baixada Santista */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div className="flex shrink-0 items-center gap-1 text-[11px] text-fg-subtle">
          <MapPin className="h-3 w-3 text-brand-400" />
          <span className="whitespace-nowrap">Cidade:</span>
        </div>
        <FilterChip
          label="Toda a rede"
          active={currentCity === "all"}
          onClick={() => update("city", "all")}
        />
        {BAIXADA_SANTISTA.map((city) => (
          <FilterChip
            key={city}
            label={city}
            active={currentCity === city}
            onClick={() => update("city", city)}
          />
        ))}
      </div>

      {isPending && (
        <p className="text-[10px] text-fg-subtle animate-pulse">Filtrando…</p>
      )}
    </div>
  );
}
