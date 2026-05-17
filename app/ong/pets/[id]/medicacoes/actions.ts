"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { z } from "zod";

const MedicationSchema = z.object({
  medication_name: z.string().min(1, "Nome do medicamento obrigatório").max(150),
  dosage: z.string().min(1, "Dosagem obrigatória").max(100),
  frequency: z.string().min(1, "Frequência obrigatória").max(100),
  start_date: z.string().min(1, "Data de início obrigatória"),
  end_date: z.string().optional(),
  is_ongoing: z.coerce.boolean().default(false),
  reason: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
});

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
  // @ts-expect-error join
  return data && data.shelters.user_id === userId;
}

export async function addMedication(
  petId: string,
  _prev: MedState,
  formData: FormData
): Promise<MedState> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { error: "Não autenticado." };
  if (!(await assertPetOwner(supabase, petId, user.id))) return { error: "Sem permissão." };

  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => v !== ""));
  // Checkbox retorna "on" se marcado, ausente se não
  raw.is_ongoing = formData.get("is_ongoing") === "on" ? true : false;

  const parsed = MedicationSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { error } = await supabase.from("medications").insert({ ...parsed.data, pet_id: petId });
  if (error) return { error: error.message };

  revalidatePath(`/ong/pets/${petId}/medicacoes`);
  revalidatePath(`/ong/pets/${petId}`);
  return { success: true };
}

export async function finalizeMedication(petId: string, medicationId: string): Promise<MedState> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { error: "Não autenticado." };
  if (!(await assertPetOwner(supabase, petId, user.id))) return { error: "Sem permissão." };

  const { error } = await supabase
    .from("medications")
    .update({ is_ongoing: false, end_date: new Date().toISOString().split("T")[0] })
    .eq("id", medicationId);

  if (error) return { error: error.message };

  revalidatePath(`/ong/pets/${petId}/medicacoes`);
  revalidatePath(`/ong/pets/${petId}`);
  return { success: true };
}
