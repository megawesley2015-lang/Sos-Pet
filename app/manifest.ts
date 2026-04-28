import type { MetadataRoute } from "next";

/**
 * PWA manifest — gera /manifest.webmanifest dinamicamente.
 *
 * Quando instalado como PWA (Add to Home Screen no iOS/Android),
 * abre em modo standalone com tema dark + brand-500.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SOS Pet — Achados & Perdidos",
    short_name: "SOS Pet",
    description:
      "Rede colaborativa de resgate. Cadastre seu pet perdido, dispare um SOS e conte com a rede pra trazer ele de volta.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F0F1A", // ink-800
    theme_color: "#FF6B35", // brand-500
    orientation: "portrait",
    lang: "pt-BR",
    categories: ["lifestyle", "social", "utilities"],
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
