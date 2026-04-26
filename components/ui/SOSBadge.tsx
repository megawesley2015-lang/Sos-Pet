import { cn } from "@/lib/utils/cn";
import type { PetKind } from "@/lib/types/database";

interface SOSBadgeProps {
  kind: PetKind;
  className?: string;
}

/**
 * Badge de status do pet.
 * - "lost"  → laranja com pulse (urgência SOS)
 * - "found" → ciano estático (neutro, acolhedor)
 */
export function SOSBadge({ kind, className }: SOSBadgeProps) {
  const isLost = kind === "lost";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        isLost
          ? "animate-pulse-brand border-brand-500/60 bg-brand-500/20 text-brand-200"
          : "border-cyan-500/60 bg-cyan-500/15 text-cyan-200 shadow-glow-cyan",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isLost ? "bg-brand-500 shadow-glow-brand" : "bg-cyan-500 shadow-glow-cyan"
        )}
      />
      {isLost ? "SOS Perdido" : "Encontrado"}
    </span>
  );
}
