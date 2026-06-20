"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/pets",          label: "Achados" },
  { href: "/adotar",        label: "❤️ Adoção" },
  { href: "/mapa",          label: "Mapa" },
  { href: "/avistamentos",  label: "Avistamentos" },
  { href: "/prestadores",   label: "Prestadores" },
  { href: "/dicas",         label: "Dicas" },
  { href: "/sentinela",     label: "📷 Sentinela" },
  { href: "/loja",          label: "🛍️ Loja" },
];

interface NavLinksProps {
  variant?: "light" | "dark";
}

export function NavLinks({ variant = "light" }: NavLinksProps) {
  const pathname = usePathname();

  const containerCls =
    variant === "dark"
      ? "border border-white/10 bg-white/5"
      : "border border-warm-200/80 bg-warm-100/50";

  const inactiveCls =
    variant === "dark"
      ? "font-medium text-fg-muted hover:bg-white/10 hover:text-fg"
      : "font-medium text-fg-muted hover:bg-warm-200/70 hover:text-fg";

  return (
    <nav
      aria-label="Navegação principal"
      className={`hidden items-center gap-0.5 rounded-full px-1.5 py-1 xl:flex ${containerCls}`}
    >
      {LINKS.map(({ href, label }) => {
        const isActive =
          pathname === href ||
          (href.length > 1 && pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "rounded-full px-2.5 py-1.5 text-xs transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
              isActive
                ? "bg-brand-500 font-semibold text-white shadow-sm"
                : inactiveCls,
            ].join(" ")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
