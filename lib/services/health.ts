import { createSupabaseServerClient } from "../supabase/server";
import type { PetSaudeRow, PetSaudeInsert } from "../types/database";

export async function listHealthRecords(petId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("pet_saude")
    .select("*")
    .eq("pet_id", petId)
    .order("data_aplicacao", { ascending: false });

  if (error) {
    console.error("Erro ao buscar histórico de saúde:", error);
    return { records: [] as PetSaudeRow[], error: error.message };
  }

  return { records: data ?? [], error: null };
}

export async function addHealthRecord(record: PetSaudeInsert) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("pet_saude")
    .insert({ ...record })
    .select()
    .single();

  if (error) {
    console.error("Erro ao adicionar registro de saúde:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

export async function deleteHealthRecord(id: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("pet_saude").delete().eq("id", id);

  if (error) {
    console.error("Erro ao deletar registro de saúde:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
