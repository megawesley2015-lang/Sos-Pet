import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AvisoRow } from "@/lib/types/database";

/**
 * Top 5 avisos ativos não expirados, ordenados por prioridade desc.
 * Usado pelo AvisosTicker no topo da landing.
 */
export async function listAvisosAtivos(): Promise<AvisoRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("avisos")
    .select("*")
    .eq("ativo", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("prioridade", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}
