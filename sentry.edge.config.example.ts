/**
 * Sentry — config do EDGE runtime (middleware.ts e Route Handlers em edge).
 *
 * Renomeie este arquivo para `sentry.edge.config.ts` após:
 *   npm install @sentry/nextjs
 *   + setar NEXT_PUBLIC_SENTRY_DSN
 *
 * Sem DSN, init é pulado.
 *
 * Veja docs/sentry-setup.md
 */
import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    tracesSampleRate: 0.1,
    debug: false,
    environment: process.env.NODE_ENV,
  });
}
