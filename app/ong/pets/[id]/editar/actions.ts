"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { z } from "zod";

const EditShelterPetSchema = z.object({
  name:             z.string().max(100).optional(),
  species:          z.enum(["dog", "cat", "other"]),
  breed:            z.string().max(100).optional(),
  color:            z.string().min(1, "Cor é obrigatória").max(80),
  size:             z.enum(["small", "medium", "large"]),
  sex:              z.enum(["male", "female", "unknown"]),
  estimated_age:    z.string().max(50).optional(),
  rescue_date:      z.string().min(1, "Data de resgate é obrigatória"),
  rescue_location:  z.string().max(200).optional(),
  health_status:    z.enum(["healthy", "recovering", "critical", "treated"]).default("healthy"),
  behavior:         z.string().max(300).optional(),
  description:      z.string().max(1000).optional(),
  status:           z.enum(["available", "fostered", "adopted", "deceased"]).default("available"),
  // Prontuário fixo
  weight_kg:        z.coerce.number().positive().max(200).optional(),
  microchip:        z.string().max(50).optional(),
  is_castrated:     z.preprocess((v) => v === "on" || v === "true", z.boolean()).default(false),
});

export type EditPetFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function editarShelterPet(
  petId: string,
  _prev: EditPetFormState,
  formData: FormData
): Promise<EditPetFormState> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { error: "Não autenticado." };

  // Verifica ownership via RLS helper
  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!shelter) return { error: "Nenhuma ONG/abrigo cadastrado." };

  // Verifica que o pet pertence ao shelter
  const { data: pet } = await supabase
    .from("shelter_pets")
    .select("id, status")
    .eq("id", petId)
    .eq("shelter_id", shelter.id)
    .maybeSingle();
  if (!pet) return { error: "Pet não encontrado neste abrigo." };

  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => v !== "")
  );
  const parsed = EditShelterPetSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // T4 gate: mudança para 'adopted' exige adoção registrada
  if (parsed.data.status === "adopted" && pet.status !== "adopted") {
    const { data: adoption } = await supabase
      .from("adoptions")
      .select("id")
      .eq("pet_id", petId)
      .maybeSingle();
    if (!adoption) {
      return { error: "Registre a adoção antes de marcar o pet como adotado." };
    }
  }

  const { weight_kg, microchip, is_castrated, ...rest } = parsed.data;

  const { error } = await supabase
    .from("shelter_pets")
    .update({
      ...rest,
      weight_kg:    weight_kg    ?? null,
      microchip:    microchip    ?? null,
      is_castrated: is_castrated ?? false,
    })
    .eq("id", petId);

  if (error) return { error: error.message };

  revalidatePath(`/ong/pets/${petId}`);
  revalidatePath("/ong/pets");
  revalidatePath("/ong/prontuarios");
  revalidatePath("/ong/dashboard");

  redirect(`/ong/pets/${petId}`);
}
