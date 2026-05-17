/**
 * TurnstileWidget — Widget de captcha do Cloudflare.
 *
 * Para usar em forms que permitem submissão anônima.
 * Renderiza apenas no client-side; server valida o token.
 */

"use client";

import { useCallback, useEffect, useRef } from "react";

interface TurnstileWidgetProps {
  name?: string;
  className?: string;
  onTokenChange?: (token: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: "auto" | "light" | "dark";
          callback?: (token: string) => void;
          "error-callback"?: () => void;
        }
      ) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
      getResponse: (id: string) => string;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Componente que renderiza o widget Turnstile.
 * Automáticamente carrega o script do Cloudflare na primeira renderização.
 */
export function TurnstileWidget({
  name = "cf-turnstile-response",
  className = "",
  onTokenChange,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoaded = useRef(false);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !TURNSTILE_SITE_KEY) return;

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        callback: (token: string) => {
          // Popula hidden input com o token
          const hiddenInput = document.querySelector(
            `input[name="${name}"]`
          ) as HTMLInputElement | null;
          if (hiddenInput) {
            hiddenInput.value = token;
          }
          onTokenChange?.(token);
        },
        "error-callback": () => {
          console.error("[Turnstile] Erro no captcha");
          onTokenChange?.("");
        },
      });
    } catch (error) {
      console.error("[Turnstile] Erro ao renderizar:", error);
    }
  }, [name, onTokenChange]);

  useEffect(() => {
    // Pula se não tem site key configurada
    if (!TURNSTILE_SITE_KEY) {
      console.warn("[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY não configurada");
      return;
    }

    // Carrega script apenas uma vez
    if (!scriptLoaded.current && !window.turnstile) {
      scriptLoaded.current = true;
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (containerRef.current && window.turnstile) {
          renderWidget();
        }
      };
      document.head.appendChild(script);
    } else if (window.turnstile && containerRef.current) {
      renderWidget();
    }

    return () => {
      // Cleanup: remove widget ao desmontar
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Silent fail
        }
      }
    };
  }, [renderWidget]);

  return (
    <>
      <div ref={containerRef} className={className} />
      {/* Hidden input para enviar o token no FormData */}
      <input type="hidden" name={name} defaultValue="" />
    </>
  );
}

/**
 * Hook para extrair token do Turnstile de um FormData.
 * Usado em Server Actions.
 */
export function extractTurnstileToken(formData: FormData): string | null {
  const token = formData.get("cf-turnstile-response");
  return typeof token === "string" ? token : null;
}
