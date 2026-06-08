"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { MedicalRecordSchema } from "@/lib/validation/ong";

export type MedRecordState = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean };

export async function addMedicalRecord(
  petId: string,
  _prev: MedRecordState,
  formData: FormData
): Promise<MedRecordState> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { error: "Não autenticado." };

  // Verifica ownership via shelter
  const { data: pet } = await supabase
    .from("shelter_pets")
    .select("id, shelters!inner(user_id)")
    .eq("id", petId)
    .maybeSingle();

  if (!pet) return { error: "Pet não encontrado." };
  
  if (pet.shelters.user_id !== user.id) return { error: "Sem permissão." };

  const raw: Record<string, unknown> = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => v !== "")
  );
  if (!raw.record_date) raw.record_date = new Date().toISOString().split("T")[0];

  const parsed = MedicalRecordSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { error } = await supabase.from("medical_records").insert({
    ...parsed.data,
    pet_id: petId,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/ong/pets/${petId}/prontuario`);
  revalidatePath(`/ong/pets/${petId}`);
  return { success: true };
}
