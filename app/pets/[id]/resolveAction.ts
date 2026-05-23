"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";

/**
 * Marca um pet como resolvido (reencontrado / devolvido).
 *
 * Segurança (dupla):
 *   1. getUserSafe → deve estar logado
 *   2. .eq("owner_id", user.id) → defense in depth além do RLS pets_update_owner
 *
 * Ao finalizar, redireciona para /meus-pets com flag de celebração.
 */
export async function resolveAction(petId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) redirect("/login?next=/pets/" + petId);

  const { error } = await supabase
    .from("pets")
    .update({ status: "resolved" })
    .eq("id", petId)
    .eq("owner_id", user.id); // garante que só o dono resolve

  if (error) throw new Error(error.message);

  redirect("/meus-pets?reencontrado=1");
}

/**
 * Reactiva um pet resolvido (caso o tutor tenha marcado por engano,
 * ou o pet fugiu novamente).
 *
 * Redireciona para /pets/[id] para mostrar o registro ativo.
 */
export async function reactivateAction(petId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("pets")
    .update({ status: "active" })
    .eq("id", petId)
    .eq("owner_id", user.id);

  if (error) throw new Error(error.message);

  redirect("/pets/" + petId);
}
