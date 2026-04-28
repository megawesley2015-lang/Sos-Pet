import { ImageResponse } from "next/og";

/**
 * Favicon — gerado via next/og.
 * Resolve o 404 de /favicon.ico que o browser pede automaticamente.
 *
 * Estilo: paw print laranja em fundo dark com borda glow.
 * Renderizado em build, cacheado pela Vercel.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0F",
          borderRadius: 6,
          border: "2px solid #FF6B35",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="#FF6B35"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Paw print simplificada — 4 dedinhos + palma */}
          <ellipse cx="6" cy="9" rx="2" ry="2.5" />
          <ellipse cx="10.5" cy="6.5" rx="2" ry="2.5" />
          <ellipse cx="15" cy="6.5" rx="2" ry="2.5" />
          <ellipse cx="19.5" cy="9" rx="2" ry="2.5" />
          <ellipse cx="12.75" cy="16.5" rx="6" ry="5" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
