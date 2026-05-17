"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { z } from "zod";

const VaccinationSchema = z.object({
  vaccine_name: z.string().min(1, "Nome da vacina obrigatório").max(100),
  applied_date: z.string().min(1, "Data de aplicação obrigatória"),
  next_dose_date: z.string().optional(),
  vet_name: z.string().max(100).optional(),
  batch: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
});

export type VaccineState = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean };

async function assertPetOwner(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, petId: string, userId: string) {
  const { data } = await supabase
    .from("shelter_pets")
    .select("id, shelters!inner(user_id)")
    .eq("id", petId)
    .maybeSingle();
  // @ts-expect-error join
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

export async function deleteVaccination(petId: string, vaccinationId: string): Promise<VaccineState> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { error: "Não autenticado." };
  if (!(await assertPetOwner(supabase, petId, user.id))) return { error: "Sem permissão." };

  const { error } = await supabase.from("vaccinations").delete().eq("id", vaccinationId);
  if (error) return { error: error.message };

  revalidatePath(`/ong/pets/${petId}/vacinas`);
  return { success: true };
}
