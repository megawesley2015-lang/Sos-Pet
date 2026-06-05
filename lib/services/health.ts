import { createSupabaseServerClient } from "../supabase/server";
import type { PetSaudeRow, PetSaudeInsert } from "../types/database";

const PET_SAUDE_COLS = "id, created_at, updated_at, pet_id, user_id, tipo, nome, data_aplicacao, proxima_dose, notificar, observacoes";

export async function listHealthRecords(petId: string) {
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pet_saude")
    .select(PET_SAUDE_COLS)
    .eq("pet_id", petId)
    .order("data_aplicacao", { ascending: false });

  if (error) {
    console.error("Erro ao buscar histórico de saúde:", error);
    return { records: [] as PetSaudeRow[], error: error.message };
  }

  return { records: (data ?? []) as PetSaudeRow[], error: null };
}

export async function addHealthRecord(record: PetSaudeInsert) {
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pet_saude")
    .insert({ ...record })
    .select(PET_SAUDE_COLS)
    .single();

  if (error) {
    console.error("Erro ao adicionar registro de saúde:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

export async function deleteHealthRecord(id: string) {
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("pet_saude").delete().eq("id", id);

  if (error) {
    console.error("Erro ao deletar registro de saúde:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
