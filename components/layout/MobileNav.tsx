"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, PawPrint, Siren } from "lucide-react";
import { PRIMARY_LINKS, SECONDARY_LINKS, isNavActive } from "./nav-config";

interface MobileNavProps {
  isLoggedIn: boolean;
  isPrestador?: boolean;
}

/**
 * MobileNav — hamburguer + drawer lateral (visível em < xl).
 * Active state via usePathname(). Acessibilidade: focus trap + Esc.
 */
export function MobileNav({ isLoggedIn, isPrestador = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) { toggleRef.current?.focus(); return; }

    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const btnCls =
    "border border-warm-200/80 bg-warm-100/60 text-fg-muted hover:border-brand-300 hover:bg-warm-200/60 hover:text-brand-600";

  const renderLink = (link: { href: string; label: string }) => {
    const active = isNavActive(pathname, link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => setOpen(false)}
        aria-current={active ? "page" : undefined}
        className={[
          "flex items-center rounded-xl px-4 py-2.5 text-sm transition-all duration-150",
          active
            ? "bg-brand-500/10 font-semibold text-brand-600"
            : "font-medium text-fg-muted hover:bg-warm-200/50 hover:text-fg",
        ].join(" ")}
      >
        {active && (
          <span aria-hidden className="mr-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
        )}
        {link.label}
      </Link>
    );
  };

  return (
    <>
      {/* Botão hamburguer */}
      <button
        ref={toggleRef}
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 xl:hidden ${btnCls}`}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        <span>Menu</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div
            id="mobile-nav-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="absolute right-0 top-0 flex h-full w-72 max-w-[90vw] flex-col bg-white shadow-2xl animate-slide-in-right"
          >
            {/* Header do drawer */}
            <div className="flex items-center justify-between border-b border-warm-200/80 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 shadow-[0_0_14px_rgba(255,133,27,0.45)]">
                  <PawPrint className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-base font-bold text-fg">
                  SOS <span className="text-brand-500">Pet</span>
                </span>
              </div>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-warm-200/60 hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-2">
              {PRIMARY_LINKS.map(renderLink)}
              <div className="my-2 border-t border-warm-200/70" />
              {SECONDARY_LINKS.map(renderLink)}
            </nav>

            <div className="mx-5 border-t border-warm-200/80" />

            {/* Auth */}
            <div className="px-3 py-3">
              {isLoggedIn ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/meus-pets"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400"
                  >
                    <PawPrint className="h-4 w-4" strokeWidth={2.5} />
                    Meu painel
                  </Link>
                  {!isPrestador && (
                    <Link
                      href="/para-prestadores"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center rounded-xl border border-accent/50 px-4 py-3 text-sm font-bold text-accent-text transition-all hover:border-accent hover:bg-accent/5 hover:text-accent"
                    >
                      Anuncie seu serviço
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/pets/novo"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400"
                  >
                    <Siren className="h-4 w-4" strokeWidth={2.5} />
                    Perdi meu pet
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-warm-300/80 px-4 py-3 text-sm font-semibold text-fg-muted transition-all hover:border-brand-300 hover:bg-warm-100/60 hover:text-brand-600"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/para-prestadores"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-accent/40 px-4 py-3 text-sm font-bold text-accent-text transition-all hover:border-accent hover:bg-accent/5 hover:text-accent"
                  >
                    Anuncie seu serviço
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
