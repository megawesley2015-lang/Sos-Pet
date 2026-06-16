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
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold",
    "transition-[background-color,box-shadow,color,opacity] duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    fullWidth && "w-full",
    variant === "primary" &&
      "bg-brand-500 text-white shadow-glow-brand hover:bg-brand-400 hover:shadow-glow-brand-lg active:translate-y-px focus-visible:ring-brand-500",
    variant === "secondary" &&
      "border border-accent/50 bg-accent/10 text-accent hover:bg-accent/20 hover:shadow-glow-cyan active:translate-y-px focus-visible:ring-accent",
    variant === "ghost" &&
      "text-fg-muted hover:bg-fg/5 hover:text-fg focus-visible:ring-fg-muted",
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
