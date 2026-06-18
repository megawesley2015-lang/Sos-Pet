"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, PawPrint, Siren } from "lucide-react";

interface MobileNavProps {
  isLoggedIn: boolean;
  isPrestador?: boolean;
}

const NAV_LINKS = [
  { href: "/pets",        label: "Achados & Perdidos" },
  { href: "/mapa",        label: "🗺️ Mapa de Alertas" },
  { href: "/avistamentos",label: "Avistamentos" },
  { href: "/prestadores", label: "Prestadores" },
  { href: "/dicas",       label: "Dicas" },
  { href: "/sentinela",   label: "📷 Rede Sentinela" },
  { href: "/parcerias",   label: "Parcerias" },
  { href: "/loja",        label: "🛍️ Loja" },
];

/**
 * MobileNav — menu hamburguer para o MarketingHeader (mobile).
 * Visível apenas em telas < sm (escondido no desktop via sm:hidden).
 */
export function MobileNav({ isLoggedIn, isPrestador = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Bloquear scroll quando o drawer estiver aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fechar com Esc; trap de foco dentro do drawer
  useEffect(() => {
    if (!open) {
      toggleRef.current?.focus();
      return;
    }

    // Mover foco para o primeiro elemento focável do drawer
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

  return (
    <>
      {/* Botão hamburguer — só mobile */}
      <button
        ref={toggleRef}
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-warm-200 bg-warm-100/60 text-fg-muted transition-colors hover:bg-warm-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 lg:hidden"
      >
        {open ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            aria-hidden
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Painel lateral */}
          <div
            id="mobile-nav-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="absolute right-0 top-0 h-full w-72 max-w-[90vw] bg-warm-50 shadow-2xl animate-slide-in-right"
          >
            {/* Header do drawer */}
            <div className="flex items-center justify-between border-b border-warm-200/80 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-500 bg-brand-100">
                  <PawPrint className="h-3.5 w-3.5 text-brand-600" strokeWidth={2.5} />
                </div>
                <span className="font-display text-base font-bold text-fg">
                  SOS <span className="text-brand-500">Pet</span>
                </span>
              </div>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-warm-200 text-fg-muted hover:bg-warm-200/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Links de navegação */}
            <nav className="px-3 pt-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-fg-muted transition-colors hover:bg-warm-200/60 hover:text-brand-600"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Divisor */}
            <div className="mx-5 my-4 border-t border-warm-200/80" />

            {/* Auth */}
            <div className="px-3">
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
                      className="flex items-center justify-center rounded-xl border border-accent px-4 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent/10"
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
                    Cadastrar pet perdido
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-warm-200 bg-warm-100/60 px-4 py-3 text-sm font-bold text-fg-muted transition-colors hover:bg-warm-200/60"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/para-prestadores"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-accent px-4 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent/10"
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
