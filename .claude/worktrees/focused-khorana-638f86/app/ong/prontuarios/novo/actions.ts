"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { redirect } from "next/navigation";

export async function criarProntuarioAction(
  formData: FormData
): Promise<{ id: string } | null> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  const pet_id       = formData.get("pet_id") as string;
  const data_resgate = formData.get("data_resgate") as string;
  if (!pet_id || !data_resgate) return null;

  const { data, error } = await supabase
    .from("prontuarios")
    .insert({
      pet_id,
      ong_id:          user.id,
      data_resgate,
      situacao_saude:  (formData.get("situacao_saude") as string) || "boa",
      peso_kg:         formData.get("peso_kg") ? Number(formData.get("peso_kg")) : null,
      microchip:       (formData.get("microchip") as string)?.trim() || null,
      castrado:        formData.get("castrado") === "true",
      observacoes:     (formData.get("observacoes") as string)?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return { id: data.id };
}
