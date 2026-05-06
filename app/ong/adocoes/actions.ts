"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { redirect } from "next/navigation";

async function getUser() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

export async function registrarAdocaoAction(formData: FormData) {
  const { supabase, userId } = await getUser();

  const pet_id = formData.get("pet_id") as string;
  const adotante_nome = (formData.get("adotante_nome") as string).trim();
  const adotante_telefone = (formData.get("adotante_telefone") as string).trim();

  if (!pet_id || !adotante_nome || !adotante_telefone) return;

  await supabase.from("adocoes").insert({
    pet_id,
    ong_id: userId,
    adotante_nome,
    adotante_telefone,
    adotante_email:  (formData.get("adotante_email") as string)?.trim() || null,
    adotante_cpf:    (formData.get("adotante_cpf") as string)?.trim() || null,
    data_adocao:     (formData.get("data_adocao") as string),
    observacoes:     (formData.get("observacoes") as string)?.trim() || null,
    status: "ativo",
  });

  revalidatePath("/ong/adocoes");
  revalidatePath("/ong");
}

export async function marcarAcompanhamentoAction(formData: FormData) {
  const { supabase } = await getUser();

  const adocaoId = formData.get("adocao_id") as string;
  const field = formData.get("field") as string;

  // Apenas campos permitidos
  if (field !== "acompanhamento_30d" && field !== "acompanhamento_90d") return;

  await supabase
    .from("adocoes")
    .update({
      [field]: true,
      [`${field}_em`]: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", adocaoId);

  revalidatePath("/ong/adocoes");
  revalidatePath("/ong");
}

export async function atualizarStatusAdocaoAction(formData: FormData) {
  const { supabase } = await getUser();

  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const VALID = ["ativo", "devolvido", "falecido", "transferido"];
  if (!VALID.includes(status)) return;

  await supabase
    .from("adocoes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/ong/adocoes");
}
