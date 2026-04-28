"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary — só dispara se o root layout (ou error.tsx) crashar.
 * Tem que renderizar <html> e <body> próprios porque substitui o layout root.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[global:error]", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#0F0F1A",
          color: "white",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
            Erro crítico
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
            Tivemos um problema sério na aplicação. Recarregue a página.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 20,
              padding: "12px 24px",
              borderRadius: 12,
              background: "#FF6B35",
              color: "white",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
