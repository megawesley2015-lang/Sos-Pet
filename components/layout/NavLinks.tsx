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

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden items-center gap-0.5 rounded-full border border-warm-200/80 bg-warm-100/50 px-1.5 py-1 xl:flex"
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
              "rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
              isActive
                ? "bg-brand-500 font-semibold text-white shadow-sm"
                : "text-fg-muted hover:bg-warm-200/70 hover:text-fg",
            ].join(" ")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
