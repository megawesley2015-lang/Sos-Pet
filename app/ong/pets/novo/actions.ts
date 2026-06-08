"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { ShelterPetSchema } from "@/lib/validation/ong";

export type ShelterPetFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function createShelterPet(
  _prev: ShelterPetFormState,
  formData: FormData
): Promise<ShelterPetFormState> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { error: "Não autenticado." };

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shelter) return { error: "Nenhuma ONG/abrigo cadastrado." };

  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => v !== "")
  );

  const parsed = ShelterPetSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { data, error } = await supabase
    .from("shelter_pets")
    .insert({ ...parsed.data, shelter_id: shelter.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/ong/pets");
  revalidatePath("/ong/dashboard");
  redirect(`/ong/pets/${data.id}`);
}
