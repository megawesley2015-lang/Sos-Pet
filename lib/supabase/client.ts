/**
 * Supabase client para uso no BROWSER (Client Components).
 *
 * Use este client dentro de componentes "use client".
 * Ele lê cookies automaticamente para manter a sessão.
 *
 * Sobre tipagem: ver nota em server.ts — não passamos `<Database>` no MVP.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/^﻿/, "");
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.replace(/^﻿/, "");
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
