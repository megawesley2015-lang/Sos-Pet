/**
 * Validação de variáveis de ambiente no boot.
 *
 * Por que: o v2 quebrava em runtime quando faltava ANON_KEY.
 * Este módulo é importado uma vez por chamada de cliente Supabase
 * e joga erro descritivo cedo se algo crítico estiver faltando.
 */

interface RequiredEnv {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

interface OptionalEnv {
  NEXT_PUBLIC_SITE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export type AppEnv = RequiredEnv & OptionalEnv;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;

  const required: (keyof RequiredEnv)[] = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `[env] Variáveis obrigatórias faltando: ${missing.join(", ")}.\n` +
        `Defina em .env.local (dev) e nas variáveis de ambiente da Vercel (prod).`
    );
  }

  cached = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  return cached;
}
