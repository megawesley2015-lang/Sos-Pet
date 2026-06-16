import { cn } from "@/lib/utils/cn";
import type { PetKind } from "@/lib/types/database";

interface SOSBadgeProps {
  kind: PetKind;
  className?: string;
}

/**
 * Badge de status do pet.
 * - "lost"  → laranja âmbar com pulse (urgência SOS)
 * - "found" → teal estático (resolução, alívio)
 * Cores via CSS vars — adaptam automaticamente a light/dark mode.
 */
export function SOSBadge({ kind, className }: SOSBadgeProps) {
  const isLost = kind === "lost";

  const spanStyle = isLost
    ? {
        background:  "var(--color-badge-lost-bg)",
        color:       "var(--color-badge-lost-fg)",
        borderColor: "var(--color-badge-lost-ring)",
      }
    : {
        background:  "var(--color-badge-found-bg)",
        color:       "var(--color-badge-found-fg)",
        borderColor: "var(--color-badge-found-ring)",
      };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        className
      )}
      style={spanStyle}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", isLost && "animate-pulse")}
        style={{ backgroundColor: isLost ? "var(--color-badge-lost-fg)" : "var(--color-badge-found-fg)" }}
      />
      {isLost ? "SOS Perdido" : "Encontrado"}
    </span>
  );
}
