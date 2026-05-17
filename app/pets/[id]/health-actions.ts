"use server";

import { revalidatePath } from "next/cache";
import { addHealthRecord, deleteHealthRecord } from "@/lib/services/health";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import type { PetSaudeTipo } from "@/lib/types/database";

export async function createHealthRecordAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    return { ok: false, message: "Não autorizado." };
  }

  const pet_id = formData.get("pet_id") as string;
  const tipo = formData.get("tipo") as PetSaudeTipo;
  const nome = formData.get("nome") as string;
  const data_aplicacao = formData.get("data_aplicacao") as string;
  const proxima_dose = formData.get("proxima_dose") as string | null;
  const observacoes = formData.get("observacoes") as string | null;
  const notificar = formData.get("notificar") === "on";

  if (!pet_id || !tipo || !nome || !data_aplicacao) {
    return { ok: false, message: "Preencha os campos obrigatórios." };
  }

  const result = await addHealthRecord({
    pet_id,
    user_id: user.id,
    tipo,
    nome,
    data_aplicacao,
    proxima_dose: proxima_dose ? proxima_dose : null,
    observacoes: observacoes ? observacoes : null,
    notificar,
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  revalidatePath(`/pets/${pet_id}`);
  return { ok: true };
}

export async function deleteHealthRecordAction(id: string, petId: string) {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    return { ok: false, message: "Não autorizado." };
  }

  const result = await deleteHealthRecord(id);

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  revalidatePath(`/pets/${petId}`);
  return { ok: true };
}
