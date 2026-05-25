"use client";

import { Search } from "lucide-react";

interface SearchFloatingBarProps {
  locationStats: Array<{ city: string; lost: number; found: number }>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SearchFloatingBar({
  locationStats,
  searchQuery,
  onSearchChange,
}: SearchFloatingBarProps) {
  const totalLost = locationStats.reduce((sum, loc) => sum + loc.lost, 0);
  const totalFound = locationStats.reduce((sum, loc) => sum + loc.found, 0);

  return (
    <div className="absolute top-4 left-1/2 z-10 w-11/12 max-w-md -translate-x-1/2">
      <div className="rounded-xl border border-white/12 bg-ink-900/95 backdrop-blur-md shadow-lg">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
          <Search className="h-4 w-4 text-fg-muted flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar por bairro ou cidade…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle text-fg"
          />
        </div>

        {/* Pet Counters */}
        <div className="flex items-center justify-around px-4 py-3">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
              <span className="text-xs font-semibold text-brand-400">
                {totalLost}
              </span>
            </div>
            <span className="text-[10px] text-fg-subtle">Perdidos</span>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400">
                {totalFound}
              </span>
            </div>
            <span className="text-[10px] text-fg-subtle">Encontrados</span>
          </div>
        </div>
      </div>
    </div>
  );
}
