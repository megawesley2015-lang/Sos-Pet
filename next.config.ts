import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// CSP e Permissions-Policy aplicados a todas as rotas.
// Regras-chave:
//  - blob: em img-src  → preview de foto antes do upload funcionar
//  - blob: em worker-src → Leaflet Web Workers
//  - challenges.cloudflare.com → widget Turnstile (captcha)
//  - nominatim.openstreetmap.org → geocodificação de endereço
//  - vercel.live → toolbar de preview (sem isso só gera log de CSP, não quebra nada)
//  - geolocation=* em Permissions-Policy → botão GPS nos formulários
const securityHeaders = [
  {
    key: "Permissions-Policy",
    value: "geolocation=*, camera=(), microphone=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: próprio app (inline necessário pro Next.js), Turnstile, Vercel toolbar, Leaflet/leaflet.heat
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://vercel.live https://*.vercel-scripts.com https://unpkg.com",
      // Estilos: unsafe-inline necessário pro Leaflet e CSS-in-JS
      "style-src 'self' 'unsafe-inline'",
      // Imagens: blob para preview local, data para inline, https para remoto (Supabase, OSM tiles)
      "img-src 'self' blob: data: https:",
      // Fontes
      "font-src 'self' data:",
      // Conexões: Supabase REST + Realtime, Sentry, Nominatim, OSM tiles, unpkg
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org https://*.sentry.io https://sentry.io https://vitals.vercel-insights.com https://vercel.live https://unpkg.com",
      // Workers (Leaflet usa blob workers)
      "worker-src 'self' blob:",
      // Frames (Turnstile roda num iframe)
      "frame-src https://challenges.cloudflare.com https://vercel.live",
    ].join("; "),
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // Aplica em todas as rotas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
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
