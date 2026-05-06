"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { AvisoRow } from "@/lib/types/database";

interface AvisosTickerProps {
  avisos: AvisoRow[];
}

const ROTATION_MS = 6000;

/**
 * Banner ticker no topo do (marketing)/layout.
 *
 * - Auto-rotaciona entre avisos a cada ROTATION_MS
 * - Pausa rotação no hover (acessibilidade)
 * - Suporta expand de 1 mensagem (sem rotação) se houver só 1
 * - Esconde se a lista chegar vazia
 */
export function AvisosTicker({ avisos }: AvisosTickerProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || avisos.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % avisos.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [paused, avisos.length]);

  if (avisos.length === 0) return null;
  // Garante que o índice nunca ultrapassa o array (proteção contra mudança de tamanho)
  const safeIndex = index % avisos.length;
  const current = avisos[safeIndex];

  const inner = (
    <div className="flex items-center gap-2 truncate text-xs sm:text-sm">
      {current.emoji && (
        <span className="shrink-0 text-base" aria-hidden>
          {current.emoji}
        </span>
      )}
      <span className="truncate font-medium text-white">{current.mensagem}</span>
      {current.link && (
        <ChevronRight className="ml-1 h-3.5 w-3.5 shrink-0 text-white/80" />
      )}
    </div>
  );

  return (
    <div
      className="border-b border-brand-700/40 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-6xl px-4 py-2">
        {current.link ? (
          <Link
            href={current.link}
            className="block transition-opacity hover:opacity-90"
          >
            {inner}
          </Link>
        ) : (
          inner
        )}

        {/* Pontinhos de progresso (só aparecem se houver +1 aviso) */}
        {avisos.length > 1 && (
          <div className="mt-1 flex justify-center gap-1">
            {avisos.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={`h-1 rounded-full transition-all ${
                  i === safeIndex
                    ? "w-4 bg-white"
                    : "w-1 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
