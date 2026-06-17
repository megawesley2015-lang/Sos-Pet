import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// CSP e Permissions-Policy aplicados a todas as rotas.
// Regras-chave:
//  - blob: em img-src  → preview de foto antes do upload
//  - blob: em worker-src → Leaflet Web Workers
//  - challenges.cloudflare.com → widget Turnstile (captcha)
//  - nominatim.openstreetmap.org → geocodificação de endereço
//  - geolocation=* → botão GPS nos formulários (formulário de pets e alertas)
const securityHeaders = [
  // Impede que o site seja carregado em iframes (clickjacking)
  {
    key: "X-Frame-Options",
    value: "DENY",
  },

  // Impede que o browser adivinhe o MIME type (XSS via upload)
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  // Controla o que é enviado como Referrer em links externos
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  // geolocation=* necessário para o botão de GPS nos formulários de pet/alerta
  {
    key: "Permissions-Policy",
    value: "geolocation=*, camera=(), microphone=()",
  },

  // Força HTTPS por 1 ano — ativar só após domínio próprio confirmado
  // { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },

  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://vercel.live https://*.vercel-scripts.com https://unpkg.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org https://*.sentry.io https://sentry.io https://vitals.vercel-insights.com https://vercel.live https://unpkg.com",
      "worker-src 'self' blob:",
      "frame-src https://challenges.cloudflare.com https://vercel.live",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["web-push"],
  async headers() {
    return [
      {
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
      // Unsplash — usado nos mocks do Hall de Reencontros
      // (substitui quando tutores enviarem fotos reais via Storage)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

// Sentry só ativa quando NEXT_PUBLIC_SENTRY_DSN está definido.
// Sem DSN: zero overhead, sem source maps upload, build idêntico.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring",
      disableLogger: true,
      silent: !process.env.CI,
    })
  : nextConfig;
