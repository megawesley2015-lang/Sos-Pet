import { ImageResponse } from "next/og";

/**
 * OG image padrão (usada quando alguém compartilha a landing).
 * Tamanho recomendado: 1200×630 (16:8.4 — padrão Twitter/Facebook).
 */
export const alt = "SOS Pet — Achados & Perdidos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0A0A0F",
          backgroundImage:
            "radial-gradient(circle at 25% 30%, rgba(255,107,53,0.25) 0%, transparent 50%), radial-gradient(circle at 75% 70%, rgba(0,229,255,0.18) 0%, transparent 50%)",
          padding: 64,
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
          color: "white",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "#FF6B35",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 40px rgba(255,107,53,0.5)",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="6" cy="9" rx="2" ry="2.5" />
              <ellipse cx="10.5" cy="6.5" rx="2" ry="2.5" />
              <ellipse cx="15" cy="6.5" rx="2" ry="2.5" />
              <ellipse cx="19.5" cy="9" rx="2" ry="2.5" />
              <ellipse cx="12.75" cy="16.5" rx="6" ry="5" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 32, fontWeight: 800 }}>
              SOS <span style={{ color: "#FF6B35" }}>Pet</span>
            </span>
            <span
              style={{
                fontSize: 14,
                letterSpacing: 4,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
              }}
            >
              Achados &amp; Perdidos
            </span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h1
            style={{
              fontSize: 92,
              fontWeight: 900,
              margin: 0,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Reencontre quem
            <br />
            <span
              style={{
                color: "#FF6B35",
                textShadow: "0 0 32px rgba(255,107,53,0.6)",
              }}
            >
              se perdeu.
            </span>
          </h1>
          <p
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.7)",
              margin: 0,
              maxWidth: 800,
            }}
          >
            Cadastre, dispare um SOS e conte com a rede.
          </p>
        </div>

        {/* Footer URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
            }}
          >
            <span
              style={{
                background: "rgba(255,107,53,0.15)",
                color: "#FFA06B",
                padding: "10px 18px",
                borderRadius: 999,
                fontSize: 16,
                fontWeight: 700,
                border: "1px solid rgba(255,107,53,0.3)",
              }}
            >
              Cadastre seu pet
            </span>
            <span
              style={{
                background: "rgba(0,229,255,0.12)",
                color: "#7FF0FF",
                padding: "10px 18px",
                borderRadius: 999,
                fontSize: 16,
                fontWeight: 700,
                border: "1px solid rgba(0,229,255,0.3)",
              }}
            >
              Encontre prestadores
            </span>
          </div>
          <span
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: 2,
            }}
          >
            sospet.app
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
