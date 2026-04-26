import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/utils/url";

/**
 * robots.txt — gerado dinamicamente pra apontar pro sitemap
 * com a URL canônica correta de cada ambiente (preview/prod).
 *
 * Bloqueia rotas privadas (auth e área logada).
 */
export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/login",
          "/registro",
          "/esqueci-senha",
          "/redefinir-senha",
          "/auth/callback",
          "/meus-pets",
          "/perfil",
          "/dashboard-prestador",
          "/resgate",
          "/pets/novo",
          "/api",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
