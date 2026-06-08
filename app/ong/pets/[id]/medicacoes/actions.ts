"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { MedicationSchema } from "@/lib/validation/ong";

export type MedState = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean };

async function assertPetOwner(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  petId: string,
  userId: string
) {
  const { data } = await supabase
    .from("shelter_pets")
    .select("id, shelters!inner(user_id)")
    .eq("id", petId)
    .maybeSingle();
  
  return data && data.shelters.user_id === userId;
}

export async function addMedication(
  petId: string,
  _prev: MedState,
  formData: FormData
): Promise<MedState> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { error: "Nao autenticado." };
  if (!(await assertPetOwner(supabase, petId, user.id))) return { error: "Sem permissao." };

  const raw: Record<string, FormDataEntryValue | boolean> = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => v !== "")
  );
  raw.is_ongoing = formData.get("is_ongoing") === "on";

  const parsed = MedicationSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { error } = await supabase.from("medications").insert({ ...parsed.data, pet_id: petId });
  if (error) return { error: error.message };

  revalidatePath(`/ong/pets/${petId}/medicacoes`);
  revalidatePath(`/ong/pets/${petId}`);
  return { success: true };
}

export async function finalizeMedication(petId: string, medicationId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return;
  if (!(await assertPetOwner(supabase, petId, user.id))) return;

  await supabase
    .from("medications")
    .update({ is_ongoing: false, end_date: new Date().toISOString().split("T")[0] })
    .eq("id", medicationId);

  revalidatePath(`/ong/pets/${petId}/medicacoes`);
  revalidatePath(`/ong/pets/${petId}`);
}
