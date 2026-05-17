/**
 * Sentry — config do SERVER (Node runtime: Server Components, Server Actions,
 * Route Handlers).
 *
 * Renomeie este arquivo para `sentry.server.config.ts` após:
 *   npm install @sentry/nextjs
 *   + setar NEXT_PUBLIC_SENTRY_DSN
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
    tracesSampleRate: 0.1,

    // Filtra erros conhecidos de framework
    ignoreErrors: [
      "NEXT_REDIRECT", // Server Action redirect, não é erro
      "NEXT_NOT_FOUND",
    ],

    debug: process.env.NODE_ENV !== "production",
    environment: process.env.NODE_ENV,

    beforeSend(event) {
      // Não captura em dev local a menos que SENTRY_DEBUG=1
      if (process.env.NODE_ENV !== "production" && !process.env.SENTRY_DEBUG) {
        return null;
      }
      return event;
    },
  });
}
