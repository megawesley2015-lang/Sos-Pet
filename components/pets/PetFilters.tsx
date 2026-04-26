"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { FilterChip } from "@/components/ui/FilterChip";

/**
 * Filtros client-side que atualizam a URL (searchParams).
 * Server Component da listagem lê os params e filtra no Supabase.
 * Padrão "URL as state" — compartilhável, funciona com botão voltar.
 */
export function PetFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentKind = params.get("kind") ?? "all";
  const currentSpecies = params.get("species") ?? "all";

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
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          label="Todos"
          active={currentKind === "all"}
          onClick={() => update("kind", "all")}
        />
        <FilterChip
          label="Perdidos"
          active={currentKind === "lost"}
          variant="brand"
          onClick={() => update("kind", "lost")}
        />
        <FilterChip
          label="Encontrados"
          active={currentKind === "found"}
          variant="cyan"
          onClick={() => update("kind", "found")}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          label="Qualquer espécie"
          active={currentSpecies === "all"}
          onClick={() => update("species", "all")}
        />
        <FilterChip
          label="Cão"
          active={currentSpecies === "dog"}
          onClick={() => update("species", "dog")}
        />
        <FilterChip
          label="Gato"
          active={currentSpecies === "cat"}
          onClick={() => update("species", "cat")}
        />
        <FilterChip
          label="Outros"
          active={currentSpecies === "other"}
          onClick={() => update("species", "other")}
        />
      </div>
      {isPending && (
        <p className="text-[10px] text-fg-subtle">Atualizando...</p>
      )}
    </div>
  );
}
