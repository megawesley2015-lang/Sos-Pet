/**
 * Sentry — config do BROWSER (Client Components, hydration mismatches, runtime UI).
 *
 * Renomeie este arquivo para `sentry.client.config.ts` após:
 *   npm install @sentry/nextjs
 *   + setar NEXT_PUBLIC_SENTRY_DSN em .env.local
 *
 * Sem DSN, init é pulado e o app continua sem overhead.
 *
 * Veja docs/sentry-setup.md
 */
import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    // 10% de traces — ajustar pra cima se o volume estiver baixo, pra baixo se passar do free tier.
    tracesSampleRate: 0.1,

    // Replay (gravação de sessão para ver o que o user fez antes do erro)
    // 10% de sessões normais, 100% de sessões com erro.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filtra erros que não são da gente (extensions, ad-blockers)
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
    ],

    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false, // pets têm fotos — não vamos esconder
      }),
    ],

    // Em dev, debug; em prod, silencioso
    debug: process.env.NODE_ENV !== "production",
    environment: process.env.NODE_ENV,
  });
}
