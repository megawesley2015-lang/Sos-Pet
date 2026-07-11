"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { PRIMARY_LINKS, SECONDARY_LINKS, isNavActive } from "./nav-config";

/**
 * Navegação principal (desktop, xl+).
 * Links primários + dropdown "Mais" para os secundários.
 * Sem emoji, sem box em volta — estado ativo via underline + cor (acessível:
 * forma + cor, não só cor). Fonte dos links: nav-config.ts.
 */
export function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Fecha o "Mais" ao trocar de rota
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const inactiveCls = "text-fg-muted hover:text-fg";
  const activeCls = "text-brand-600";
  const barCls = "bg-brand-500";
  const moreActive = SECONDARY_LINKS.some((l) => isNavActive(pathname, l.href));

  const linkCls = (on: boolean) =>
    [
      "relative px-1 py-1 text-sm transition-colors duration-150",
      "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
      on ? `font-semibold ${activeCls}` : `font-medium ${inactiveCls}`,
    ].join(" ");

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden items-center gap-7 xl:flex"
    >
      {PRIMARY_LINKS.map(({ href, label }) => {
        const on = isNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={linkCls(on)}
          >
            {label}
            {on && (
              <span
                aria-hidden
                className={`absolute -bottom-1 left-1 right-1 h-0.5 rounded-full ${barCls}`}
              />
            )}
          </Link>
        );
      })}

      {/* Dropdown "Mais" */}
      <div ref={moreRef} className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`${linkCls(moreActive)} flex items-center gap-1`}
        >
          Mais
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            strokeWidth={2.5}
          />
          {moreActive && (
            <span
              aria-hidden
              className={`absolute -bottom-1 left-1 right-5 h-0.5 rounded-full ${barCls}`}
            />
          )}
        </button>

        {open && (
          <div
            role="menu"
            className={[
              "absolute right-0 top-[calc(100%+0.6rem)] w-52 overflow-hidden rounded-2xl border p-1.5 shadow-xl",
              "animate-fade-in",
              "border-warm-200/80 bg-white/97 backdrop-blur-xl",
            ].join(" ")}
          >
            {SECONDARY_LINKS.map(({ href, label }) => {
              const on = isNavActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  aria-current={on ? "page" : undefined}
                  className={[
                    "block rounded-xl px-3 py-2 text-sm transition-colors duration-150",
                    on
                      ? "bg-brand-500/10 font-semibold text-brand-600"
                      : "text-fg-muted hover:bg-warm-100 hover:text-fg",
                  ].join(" ")}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
