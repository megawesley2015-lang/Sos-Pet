/**
 * Wrappers seguros para auth.getUser() / auth.getSession().
 *
 * Substituem chamadas diretas em todo o app:
 *   ❌  const { data: { user } } = await supabase.auth.getUser();
 *   ✅  const user = await getUserSafe(supabase);
 *
 * Em caso de token corrompido, faz cleanup (handleAuthError) e retorna null.
 *
 * Importante: getUser() valida o JWT contra o servidor Supabase (mais seguro
 * que getSession() que só lê o cookie). Em Server Components/Actions, sempre
 * preferir getUserSafe().
 *
 * Tipo `SupabaseClient<Database>` é usado aqui para manter tipagem forte no
 * cliente server-side enquanto ainda aceita clientes auth-only.
 */
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { handleAuthError } from "./errors";

type AnySupabaseClient = SupabaseClient<Database, "public">;

export async function getUserSafe(
  supabase: AnySupabaseClient
): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    await handleAuthError(supabase, error);
    return null;
  }
  return data.user ?? null;
}

export async function getSessionSafe(
  supabase: AnySupabaseClient
): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    await handleAuthError(supabase, error);
    return null;
  }
  return data.session ?? null;
}

/**
 * Helper de conveniência: pega o user e o profile relacionado em uma chamada.
 * Retorna { user: null, profile: null } se deslogado ou erro.
 */
export async function getUserWithProfile(supabase: AnySupabaseClient) {
  const user = await getUserSafe(supabase);
  if (!user) return { user: null, profile: null } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile ?? null } as const;
}
