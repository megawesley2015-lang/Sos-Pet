"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, X, Zap, Truck } from "lucide-react";
import { PRESTADOR_CATEGORIES } from "@/lib/validation/provider";

/**
 * Filtros de prestadores — sincronizados com searchParams via router.replace.
 * Não bloqueia navegação enquanto a Server Component recarrega (transition).
 */
export function PrestadorFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    startTransition(() => {
      router.replace(`/prestadores?${next.toString()}`, { scroll: false });
    });
  };

  const toggle = (key: string) => {
    set(key, params.get(key) === "1" ? null : "1");
  };

  const activeCategoria = params.get("categoria") ?? "";
  const activeBusca = params.get("busca") ?? "";
  const active24h = params.get("emergencia24h") === "1";
  const activeDelivery = params.get("delivery") === "1";
  const activeCidade = params.get("cidade") ?? "";

  const hasFilter =
    activeCategoria || activeBusca || active24h || activeDelivery || activeCidade;

  return (
    <div className="space-y-3">
      {/* Linha 1: busca + cidade */}
      <div className="grid gap-2 sm:grid-cols-[1.5fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            placeholder="Buscar por nome ou descrição…"
            defaultValue={activeBusca}
            onChange={(e) => set("busca", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800/70 py-2.5 pl-10 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
        </div>
        <input
          type="text"
          placeholder="Cidade…"
          defaultValue={activeCidade}
          onChange={(e) => set("cidade", e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-ink-800/70 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        />
      </div>

      {/* Linha 2: chips de categoria */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <Chip
          label="Todas"
          active={!activeCategoria}
          onClick={() => set("categoria", null)}
        />
        {PRESTADOR_CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            label={c.label}
            active={activeCategoria === c.value}
            onClick={() => set("categoria", c.value)}
          />
        ))}
      </div>

      {/* Linha 3: toggles + clear */}
      <div className="flex flex-wrap items-center gap-2">
        <ToggleChip
          label="24h"
          icon={<Zap className="h-3 w-3" />}
          active={active24h}
          onClick={() => toggle("emergencia24h")}
        />
        <ToggleChip
          label="Delivery"
          icon={<Truck className="h-3 w-3" />}
          active={activeDelivery}
          onClick={() => toggle("delivery")}
        />

        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              startTransition(() => {
                router.replace("/prestadores", { scroll: false });
              });
            }}
            className="ml-auto inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </button>
        )}

        {pending && (
          <span className="text-xs text-cyan-400">atualizando…</span>
        )}
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
        active
          ? "border-cyan-500 bg-cyan-500/15 text-cyan-200 shadow-glow-cyan"
          : "border-white/10 bg-ink-700/50 text-fg-muted hover:border-white/20 hover:text-fg"
      }`}
    >
      {label}
    </button>
  );
}

function ToggleChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-all ${
        active
          ? "border-brand-500 bg-brand-500/15 text-brand-200 shadow-glow-brand"
          : "border-white/10 bg-ink-700/50 text-fg-muted hover:border-white/20 hover:text-fg"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
