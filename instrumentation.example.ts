/**
 * Next.js instrumentation hook — orquestra Sentry server + edge.
 *
 * Renomeie para `instrumentation.ts` após instalar @sentry/nextjs e configurar DSN.
 *
 * Veja docs/sentry-setup.md
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Só exportado quando o pacote @sentry/nextjs estiver instalado.
// Se não estiver, o `import` na linha de cima vai falhar — sinal que faltou
// rodar `npm install @sentry/nextjs`.
// export { captureRequestError } from "@sentry/nextjs/build/types/common/captureRequestError";
