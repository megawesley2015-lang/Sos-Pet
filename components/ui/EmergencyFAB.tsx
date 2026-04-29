"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, Siren, Search, PawPrint, MessageCircle } from "lucide-react";

/**
 * EmergencyFAB — Floating Action Button de ações rápidas.
 *
 * Comportamento:
 * - Esconde durante scroll para baixo (não obstrui leitura)
 * - Reaparece no scroll para cima ou ao parar
 * - Botão principal expande menu vertical com 4 ações
 * - Fecha ao clicar fora, pressionar Esc ou navegar
 * - Não aparece em telas >= lg (desktop tem nav com todos os links)
 *
 * Ações:
 *   🚨 Emergência 24h → /prestadores?emergencia=true
 *   🔍 Perdi meu pet  → /pets/novo?kind=lost
 *   🐾 Encontrei um pet → /pets/novo?kind=found
 *   💬 Suporte WhatsApp → wa.me (externo)
 */

const ACTIONS = [
  {
    id: "emergency",
    label: "Emergência 24h",
    Icon: Siren,
    href: "/prestadores?emergencia=true",
    cls: "bg-danger hover:bg-danger/90 shadow-[0_0_20px_rgba(239,68,68,0.5)]",
    external: false,
  },
  {
    id: "lost",
    label: "Perdi meu pet",
    Icon: Search,
    href: "/pets/novo?kind=lost",
    cls: "bg-brand-500 hover:bg-brand-600 shadow-glow-brand",
    external: false,
  },
  {
    id: "found",
    label: "Encontrei um pet",
    Icon: PawPrint,
    href: "/pets/novo?kind=found",
    cls: "bg-cyan-500 hover:bg-cyan-600 shadow-glow-cyan",
    external: false,
  },
  {
    id: "whatsapp",
    label: "Suporte",
    Icon: MessageCircle,
    href: "https://wa.me/5513999999999?text=Olá! Preciso de ajuda no SOS Pet",
    cls: "bg-green-500 hover:bg-green-600",
    external: true,
  },
] as const;

export default function EmergencyFAB() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  // Esconde no scroll ↓, mostra no scroll ↑
  const onScroll = useCallback(() => {
    const y = window.scrollY;
    if (y > lastY && y > 120) {
      setVisible(false);
      setOpen(false);
    } else {
      setVisible(true);
    }
    setLastY(y);
  }, [lastY]);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const el = (e.target as Element).closest(".emergency-fab");
      if (!el) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Fechar com Esc
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Backdrop suave quando expandido */}
      <div
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* FAB container — só em mobile/tablet */}
      <div
        className={`emergency-fab fixed bottom-6 right-4 z-50 flex flex-col items-end gap-3 transition-all duration-300 lg:hidden ${
          visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        {/* Sub-ações */}
        <div
          role="menu"
          aria-label="Ações rápidas de emergência"
          className={`flex flex-col items-end gap-2.5 transition-all duration-300 ${
            open
              ? "opacity-100 translate-y-0"
              : "pointer-events-none opacity-0 translate-y-3"
          }`}
        >
          {ACTIONS.map((action, i) => {
            const Icon = action.Icon;
            const delay = open ? `${i * 45}ms` : "0ms";
            const labelDelay = open ? `${i * 45 + 80}ms` : "0ms";

            const inner = (
              <div
                className="flex items-center gap-2.5"
                style={{ transitionDelay: delay }}
              >
                {/* Label */}
                <span
                  className={`rounded-xl bg-ink-800/90 px-3 py-1.5 text-xs font-bold text-fg shadow-card-dark backdrop-blur-sm transition-all duration-200 ${
                    open
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-2"
                  }`}
                  style={{ transitionDelay: labelDelay }}
                >
                  {action.label}
                </span>

                {/* Botão circular */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110 ${action.cls}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </div>
              </div>
            );

            return action.external ? (
              <a
                key={action.id}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                aria-label={action.label}
                onClick={() => setOpen(false)}
              >
                {inner}
              </a>
            ) : (
              <Link
                key={action.id}
                href={action.href}
                role="menuitem"
                aria-label={action.label}
                onClick={() => setOpen(false)}
              >
                {inner}
              </Link>
            );
          })}
        </div>

        {/* Botão principal */}
        <div className="relative">
          {/* Ping indicator quando fechado */}
          {!open && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500" />
            </span>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={open ? "Fechar menu" : "Abrir ações de emergência"}
            className={`flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400/60 ${
              open
                ? "rotate-45 bg-ink-700 shadow-card-dark"
                : "bg-gradient-to-br from-red-500 to-brand-600 shadow-[0_0_24px_rgba(239,68,68,0.6)]"
            }`}
          >
            {open ? (
              <X className="h-6 w-6 text-white" strokeWidth={2.5} />
            ) : (
              <Siren className="h-6 w-6 text-white" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
