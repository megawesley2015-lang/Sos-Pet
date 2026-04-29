"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

/**
 * PWAInstaller — Prompt de instalação do app
 *
 * Comportamento por plataforma:
 * - Android/Chrome: usa o evento nativo `beforeinstallprompt`
 * - iOS/Safari: não tem o evento — mostra instruções manuais
 *   (botão Share → "Adicionar à Tela de Início")
 *
 * Regras:
 * - Não aparece se já instalado (display-mode: standalone)
 * - Aparece após 8 segundos na página
 * - Se dispensado, fica oculto por 7 dias (localStorage)
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Já instalado como standalone — não mostra
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Verifica se foi dispensado recentemente (7 dias)
    const dismissed = localStorage.getItem("pwa-dismissed");
    if (dismissed) {
      const dias = (Date.now() - parseInt(dismissed)) / 86_400_000;
      if (dias < 7) return;
    }

    // Detecta iOS (Safari não dispara beforeinstallprompt)
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator as { standalone?: boolean }).standalone;
    setIsIOS(ios);

    // Registra o Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("[PWA] SW não registrado:", err);
      });
    }

    // Captura o evento nativo (Android/Chrome/Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    // Mostra o banner após 8 segundos
    const timer = setTimeout(() => {
      setVisible(true);
    }, 8000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("pwa-dismissed", Date.now().toString());
  };

  // Só mostra se: visível + (tem prompt nativo OU é iOS)
  if (!visible || (!deferredPrompt && !isIOS)) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar SOS Pet"
      className="fixed bottom-20 left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300 md:bottom-6 md:left-auto md:right-6 md:w-96"
    >
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-700/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-2xl">
            🐾
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-fg">Instalar SOS Pet</p>
            <p className="mt-0.5 text-xs text-fg-muted">
              Acesso rápido direto da tela inicial, mesmo offline
            </p>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Fechar"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-fg-subtle hover:text-fg"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Instruções iOS */}
        {isIOS && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3">
            <p className="mb-2 text-xs font-medium text-fg-muted">Como instalar no iPhone:</p>
            <ol className="space-y-1.5 text-xs text-fg-subtle">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-300">1</span>
                Toque no botão <Share className="mx-1 inline h-3.5 w-3.5 text-cyan-400" /> (compartilhar) no Safari
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-300">2</span>
                Role e toque em <strong className="text-fg">&quot;Adicionar à Tela de Início&quot;</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-300">3</span>
                Toque em <strong className="text-fg">&quot;Adicionar&quot;</strong>
              </li>
            </ol>
            <button
              onClick={handleDismiss}
              className="mt-3 w-full rounded-xl border border-white/10 py-2.5 text-xs font-medium text-fg-muted hover:bg-white/5"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Botões Android/Chrome */}
        {!isIOS && deferredPrompt && (
          <div className="flex gap-2 border-t border-white/10 p-3">
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-xl py-2.5 text-xs font-medium text-fg-muted hover:bg-white/5"
            >
              Agora não
            </button>
            <button
              onClick={handleInstall}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2.5 text-xs font-bold text-white hover:bg-brand-600"
            >
              <Download className="h-3.5 w-3.5" />
              Instalar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
