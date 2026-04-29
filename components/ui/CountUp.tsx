"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Valor alvo */
  to: number;
  /** Duração da animação em ms (default: 1800) */
  duration?: number;
  /** Sufixo exibido após o número (ex: "+", "%") */
  suffix?: string;
  /** Formata com separador de milhar pt-BR */
  format?: boolean;
}

/**
 * CountUp — anima um número de 0 até `to` usando requestAnimationFrame.
 * A animação só dispara quando o elemento entra na viewport (IntersectionObserver).
 * Usa easing easeOutExpo para desacelerar suavemente.
 */
export default function CountUp({
  to,
  duration = 1800,
  suffix = "",
  format = true,
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const animate = () => {
      if (started.current) return;
      started.current = true;

      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const ease =
          progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setValue(Math.round(ease * to));

        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration]);

  const display = format ? value.toLocaleString("pt-BR") : String(value);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}
