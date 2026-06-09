"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { VaccinationSchema } from "@/lib/validation/ong";

export type VaccineState = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean };

async function assertPetOwner(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, petId: string, userId: string) {
  const { data } = await supabase
    .from("shelter_pets")
    .select("id, shelters!inner(user_id)")
    .eq("id", petId)
    .maybeSingle();
  
  return data && data.shelters.user_id === userId;
}

export async function addVaccination(
  petId: string,
  _prev: VaccineState,
  formData: FormData
): Promise<VaccineState> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { error: "Não autenticado." };
  if (!(await assertPetOwner(supabase, petId, user.id))) return { error: "Sem permissão." };

  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => v !== ""));
  const parsed = VaccinationSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { error } = await supabase.from("vaccinations").insert({ ...parsed.data, pet_id: petId });
  if (error) return { error: error.message };

  revalidatePath(`/ong/pets/${petId}/vacinas`);
  revalidatePath(`/ong/pets/${petId}`);
  return { success: true };
}

export async function deleteVaccination(petId: string, vaccinationId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return;
  if (!(await assertPetOwner(supabase, petId, user.id))) return;

  await supabase.from("vaccinations").delete().eq("id", vaccinationId);

  revalidatePath(`/ong/pets/${petId}/vacinas`);
}
