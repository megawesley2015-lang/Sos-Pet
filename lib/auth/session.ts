import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "./safe";

/**
 * Retorna usuário + perfil em uma única execução por request.
 *
 * React.cache deduplica chamadas dentro do mesmo request:
 * se TopBar e outra Server Component chamarem getSessionWithProfile()
 * na mesma request, o Supabase é consultado apenas uma vez.
 *
 * Anteriormente o TopBar fazia 2 round-trips separados:
 *   1. getUserSafe(supabase)
 *   2. supabase.from("profiles").select(...)
 * Agora ambos ficam encapsulados e cacheados aqui.
 */
export const getSessionWithProfile = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) return { user: null, profile: null };

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRaw as
    | { full_name: string | null; avatar_url: string | null; role: string | null }
    | null;

  return { user, profile };
});
