import { ImageResponse } from "next/og";

/**
 * Apple touch icon — usado quando user adiciona à tela inicial do iOS.
 * Tamanho 180x180 é o padrão moderno (cobre iPhone 6+ e mais novos).
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 30%, #1A1A2E 0%, #0A0A0F 100%)",
          borderRadius: 36, // iOS aplica mask por cima, mas dá personalidade
        }}
      >
        {/* Halo */}
        <div
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: 999,
            border: "4px solid rgba(255,107,53,0.3)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 110,
            height: 110,
            borderRadius: 999,
            background: "#FF6B35",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 60px rgba(255,107,53,0.6)",
          }}
        >
          <svg
            width="64"
            height="64"
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
      </div>
    ),
    { ...size }
  );
}
