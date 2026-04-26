import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type CTAVariant = "primary" | "secondary" | "ghost";

interface CTAButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  children: ReactNode;
  href?: string;
  variant?: CTAVariant;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * CTAButton — botão principal do design system.
 * - primary   → laranja com glow (ação principal, 1 por tela idealmente)
 * - secondary → ciano outline (ação secundária)
 * - ghost     → transparente (ação terciária)
 */
export function CTAButton({
  children,
  href,
  variant = "primary",
  type = "button",
  icon,
  fullWidth = false,
  className,
  ...props
}: CTAButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-all",
    "disabled:cursor-not-allowed disabled:opacity-50",
    fullWidth && "w-full",
    variant === "primary" &&
      "bg-brand-500 text-white shadow-glow-brand hover:bg-brand-400 hover:shadow-glow-brand-lg active:scale-[0.98]",
    variant === "secondary" &&
      "border border-cyan-500/60 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:shadow-glow-cyan active:scale-[0.98]",
    variant === "ghost" &&
      "text-fg-muted hover:bg-white/5 hover:text-fg",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {icon}
      {children}
    </button>
  );
}
