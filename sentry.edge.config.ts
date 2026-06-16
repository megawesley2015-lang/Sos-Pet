import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN?.replace(/^﻿/, '');

if (DSN) {
  Sentry.init({
    dsn: DSN,
    tracesSampleRate: 0.1,
    debug: false,
    environment: process.env.NODE_ENV,
  });
}
