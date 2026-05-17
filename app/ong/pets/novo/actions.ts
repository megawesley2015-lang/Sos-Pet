"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { z } from "zod";

const ShelterPetSchema = z.object({
  name: z.string().max(100).optional(),
  species: z.enum(["dog", "cat", "other"]),
  breed: z.string().max(100).optional(),
  color: z.string().min(1, "Cor é obrigatória").max(80),
  size: z.enum(["small", "medium", "large"]),
  sex: z.enum(["male", "female", "unknown"]),
  estimated_age: z.string().max(50).optional(),
  rescue_date: z.string().min(1, "Data de resgate é obrigatória"),
  rescue_location: z.string().max(200).optional(),
  health_status: z.enum(["healthy", "recovering", "critical", "treated"]).default("healthy"),
  behavior: z.string().max(300).optional(),
  description: z.string().max(1000).optional(),
  photo_url: z.string().url().optional().or(z.literal("")),
  // Prontuário
  weight_kg: z.coerce.number().positive().max(200).optional(),
  microchip: z.string().max(50).optional(),
  is_castrated: z.preprocess((v) => v === "on" || v === "true", z.boolean()).default(false),
});

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
