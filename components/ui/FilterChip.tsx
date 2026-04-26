"use client";

import { cn } from "@/lib/utils/cn";

type ChipVariant = "default" | "brand" | "cyan";

interface FilterChipProps {
  label: string;
  active?: boolean;
  variant?: ChipVariant;
  onClick?: () => void;
}

export function FilterChip({
  label,
  active = false,
  variant = "default",
  onClick,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-all",
        "hover:border-white/20",
        !active && "border-white/10 bg-white/[0.03] text-fg-muted",
        active &&
          variant === "default" &&
          "border-brand-500 bg-brand-500/15 text-brand-200 shadow-glow-brand",
        active &&
          variant === "brand" &&
          "border-brand-500 bg-brand-500/20 text-brand-100 shadow-glow-brand",
        active &&
          variant === "cyan" &&
          "border-cyan-500 bg-cyan-500/15 text-cyan-100 shadow-glow-cyan"
      )}
    >
      {label}
    </button>
  );
}
