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
 * Este módulo já usa `Database` para tipagem forte nas queries do servidor.
 * Como o schema é mantido manualmente, mantemos os tipos no `lib/types/database`.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/^﻿/, "");
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.replace(/^﻿/, "");

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
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
  ) as unknown as SupabaseClient<Database>;
}

/**
 * Cliente com SERVICE ROLE — bypass de RLS.
 * Use APENAS em server-side seguro (nunca exportar para client).
 */
export function createServiceClient(): SupabaseClient<Database, "public"> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
  }
  return createSupabaseClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
