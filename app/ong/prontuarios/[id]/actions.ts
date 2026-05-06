"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { redirect } from "next/navigation";

async function getOngClient() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

export async function adicionarVacinaAction(formData: FormData) {
  const { supabase } = await getOngClient();
  const prontuarioId = formData.get("prontuario_id") as string;
  const nome = (formData.get("nome") as string).trim();
  const data_aplicacao = formData.get("data_aplicacao") as string;

  if (!nome || !data_aplicacao) return;

  await supabase.from("vacinas").insert({
    prontuario_id: prontuarioId,
    nome,
    data_aplicacao,
    proxima_dose: (formData.get("proxima_dose") as string) || null,
    veterinario:  (formData.get("veterinario") as string)?.trim() || null,
    lote:         (formData.get("lote") as string)?.trim() || null,
    observacao:   (formData.get("observacao") as string)?.trim() || null,
  });

  revalidatePath(`/ong/prontuarios/${prontuarioId}`);
}

export async function adicionarMedicacaoAction(formData: FormData) {
  const { supabase } = await getOngClient();
  const prontuarioId = formData.get("prontuario_id") as string;
  const nome = (formData.get("nome") as string).trim();
  const data_inicio = formData.get("data_inicio") as string;

  if (!nome || !data_inicio) return;

  await supabase.from("medicacoes").insert({
    prontuario_id: prontuarioId,
    nome,
    data_inicio,
    dosagem:   (formData.get("dosagem") as string)?.trim() || null,
    frequencia:(formData.get("frequencia") as string)?.trim() || null,
    data_fim:  (formData.get("data_fim") as string) || null,
    observacao:(formData.get("observacao") as string)?.trim() || null,
    ativa: true,
  });

  revalidatePath(`/ong/prontuarios/${prontuarioId}`);
}

export async function atualizarSaudeAction(formData: FormData) {
  const { supabase } = await getOngClient();
  const prontuarioId = formData.get("prontuario_id") as string;
  const situacao_saude = formData.get("situacao_saude") as string;

  await supabase
    .from("prontuarios")
    .update({ situacao_saude, updated_at: new Date().toISOString() })
    .eq("id", prontuarioId);

  revalidatePath(`/ong/prontuarios/${prontuarioId}`);
  revalidatePath("/ong/pets");
}
