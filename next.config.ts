import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

// Sentry só ativa quando NEXT_PUBLIC_SENTRY_DSN está definido.
// Sem DSN: zero overhead, sem source maps upload, build identico ao anterior.
// Com DSN: wraps webpack para upload de source maps e ativa tunnel route.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Sobe source maps mas não deixa no bundle final (segurança)
      widenClientFileUpload: true,
      // Redireciona eventos pelo próprio servidor (evita ad-blockers)
      tunnelRoute: "/monitoring",
      // Desativa logger do Sentry no bundle de prod
      disableLogger: true,
      // Silencia warnings de build exceto em CI
      silent: !process.env.CI,
    })
  : nextConfig;
