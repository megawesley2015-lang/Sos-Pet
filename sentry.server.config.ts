import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent, EventHint } from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN?.replace(/^﻿/, '');

if (DSN) {
  Sentry.init({
    dsn: DSN,
    tracesSampleRate: 0.1,
    ignoreErrors: [
      "NEXT_REDIRECT",
      "NEXT_NOT_FOUND",
    ],
    debug: process.env.NODE_ENV !== "production",
    environment: process.env.NODE_ENV,
    beforeSend(event: ErrorEvent, _hint: EventHint) {
      if (process.env.NODE_ENV !== "production" && !process.env.SENTRY_DEBUG) {
        return null;
      }
      return event;
    },
  });
}
