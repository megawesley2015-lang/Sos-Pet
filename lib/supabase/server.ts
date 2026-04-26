/**
 * Supabase client para uso no SERVIDOR (Server Components, Server Actions, Route Handlers).
 *
 * Gerencia cookies via Next.js `cookies()` para manter sessão SSR.
 * Por default usa a anon key (respeita RLS).
 *
 * Para operações privilegiadas (migrations, admin), use `createServiceClient()`
 * com a SERVICE_ROLE_KEY — NUNCA exponha no client.
 *
 * NOTA TÉCNICA — typing:
 * O supabase-js v2.50+ tem inferência de tipos genérica frágil quando o
 * `Database` é mantido à mão (não gerado via `supabase gen types`).
 * Pra MVP, optamos por NÃO passar o generic `<Database>` no client. Isso:
 *   - Desativa autocomplete de coluna nos `.select()` / `.insert()`
 *   - Mas faz queries virarem `unknown` (não `never`), que dá pra tipar
 *     manualmente com `as PetRow[]` no service layer
 * Quando trocar pra `supabase gen types`, basta restaurar `<Database>`.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore.
            // Middleware é quem refresca cookies nesse caso.
          }
        },
      },
    }
  );
}

/**
 * Cliente com SERVICE ROLE — bypass de RLS.
 * Use APENAS em server-side seguro (nunca exportar para client).
 */
export function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
