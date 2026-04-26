"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Loader2, Siren } from "lucide-react";

interface SOSButtonProps {
  /** Disparado depois de 2s de press contínuo. */
  onActivate: () => void | Promise<void>;
  /** Mostrado dentro do botão. */
  label?: string;
  /** Quando true, o botão fica em estado loading (sem permitir nova ativação). */
  loading?: boolean;
  /** Texto curto debaixo do botão. */
  hint?: string;
}

const HOLD_DURATION = 2000;
const PROGRESS_INTERVAL = 20;

/**
 * SOSButton — botão de pânico com long-press 2s.
 *
 * Princípios:
 *  - Evita acionamento acidental (é literal SOS — vai gerar imagem,
 *    publicar em rede, em alguns roadmaps até notificar usuários).
 *  - Feedback haptic + visual rico: vibra ao iniciar, vibra padrão SOS ao ativar,
 *    progress ring SVG, ondas radar, conic sweep, glow.
 *
 * UX inspirada nos botões de SOS de smartwatches.
 */
export function SOSButton({
  onActivate,
  label = "SOS",
  loading = false,
  hint = "Mantenha pressionado por 2 segundos",
}: SOSButtonProps) {
  const [progress, setProgress] = useState(0); // 0..1
  const [holding, setHolding] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activatedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    startTimeRef.current = null;
    setHolding(false);
    setProgress(0);
    activatedRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup defensivo: se desmontar com timer rolando
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startHold = useCallback(() => {
    if (loading || activatedRef.current || intervalRef.current) return;
    setHolding(true);
    startTimeRef.current = Date.now();

    // Vibração curta indicando "começou"
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(50);
      } catch {
        /* iOS Safari não suporta — ignorar */
      }
    }

    intervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / HOLD_DURATION, 1);
      setProgress(pct);

      if (pct >= 1 && !activatedRef.current) {
        activatedRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;

        // Vibração padrão SOS na ativação
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch {
            /* ignorar */
          }
        }

        // Dispara — mas mantém holding=true até loading externo terminar
        Promise.resolve(onActivate()).finally(() => {
          // Só limpa o estado visual depois que o caller termina
          cleanup();
        });
      }
    }, PROGRESS_INTERVAL);
  }, [loading, onActivate, cleanup]);

  const cancelHold = useCallback(() => {
    if (activatedRef.current) return; // já disparou — não cancela
    cleanup();
  }, [cleanup]);

  // SVG progress ring math
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const isActive = holding || loading;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="relative h-56 w-56">
        {/* Glow base */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-full bg-brand-500/30 blur-3xl transition-opacity duration-300 ${
            isActive ? "opacity-100" : "opacity-40"
          }`}
        />

        {/* Ondas radar concêntricas — só aparecem em hold */}
        {isActive && (
          <>
            <span
              className="pointer-events-none absolute inset-4 rounded-full border-2 border-brand-500/40"
              style={{ animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}
            />
            <span
              className="pointer-events-none absolute inset-2 rounded-full border-2 border-brand-500/30"
              style={{ animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }}
            />
            <span
              className="pointer-events-none absolute -inset-1 rounded-full border-2 border-brand-500/20"
              style={{ animation: "ping 2.5s cubic-bezier(0,0,0.2,1) infinite" }}
            />
          </>
        )}

        {/* Sweeping conic gradient — só durante hold (não loading) */}
        {holding && !loading && (
          <div
            className="pointer-events-none absolute inset-6 rounded-full opacity-60"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 70%, rgba(255,107,53,0.6) 95%, transparent 100%)",
              animation: "spin 1s linear infinite",
              maskImage:
                "radial-gradient(circle, transparent 60%, black 64%, black 92%, transparent 96%)",
              WebkitMaskImage:
                "radial-gradient(circle, transparent 60%, black 64%, black 92%, transparent 96%)",
            }}
          />
        )}

        {/* SVG progress ring */}
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgb(255,107,53)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: holding
                ? "none"
                : "stroke-dashoffset 0.4s ease-out",
              filter: "drop-shadow(0 0 8px rgba(255,107,53,0.6))",
            }}
          />
        </svg>

        {/* Botão central */}
        <button
          type="button"
          disabled={loading}
          aria-label={`${label} — manter pressionado`}
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={(e) => {
            // Evita scroll/long-press menu nativo
            e.preventDefault();
            startHold();
          }}
          onTouchEnd={cancelHold}
          onTouchCancel={cancelHold}
          onContextMenu={(e) => e.preventDefault()}
          className={`absolute inset-10 rounded-full bg-brand-500 text-white shadow-glow-brand-lg transition-transform ${
            holding ? "scale-95" : "active:scale-95 hover:bg-brand-400"
          } disabled:cursor-not-allowed disabled:opacity-70`}
          style={{ touchAction: "none" }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center gap-1">
            {loading ? (
              <Loader2 className="h-10 w-10 animate-spin" strokeWidth={2.5} />
            ) : (
              <Siren className="h-10 w-10" strokeWidth={2.5} />
            )}
            <span className="font-display text-lg font-black tracking-wide">
              {loading ? "..." : label}
            </span>
          </div>
        </button>
      </div>

      <p className="max-w-[18rem] text-center text-xs text-fg-muted">
        {loading
          ? "Disparando alerta…"
          : holding
            ? `Mantenha… ${Math.round(progress * 100)}%`
            : hint}
      </p>
    </div>
  );
}
