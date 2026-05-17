"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { z } from "zod";

const AdoptionSchema = z.object({
  pet_id: z.string().uuid("Pet inválido"),
  adopter_name: z.string().min(2, "Nome do adotante obrigatório").max(150),
  adopter_phone: z.string().min(10, "Telefone inválido").max(20),
  adopter_email: z.string().email().optional().or(z.literal("")),
  adopter_city: z.string().min(2, "Cidade obrigatória").max(100),
  adopter_neighborhood: z.string().max(100).optional(),
  adoption_date: z.string().min(1, "Data de adoção obrigatória"),
  // Acompanhamento pós-adoção em dois checkpoints
  follow_up_30_date: z.string().optional(),
  follow_up_30_notes: z.string().max(1000).optional(),
  follow_up_90_date: z.string().optional(),
  follow_up_90_notes: z.string().max(1000).optional(),
  status: z.enum(["active", "returned", "deceased", "transferred"]).default("active"),
});

export type AdoptionFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function createAdoption(
  _prev: AdoptionFormState,
  formData: FormData
): Promise<AdoptionFormState> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { error: "Não autenticado." };

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shelter) return { error: "Nenhuma ONG/abrigo cadastrado." };

  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => v !== ""));
  const parsed = AdoptionSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  // Verifica que o pet pertence ao shelter deste usuário
  const { data: pet } = await supabase
    .from("shelter_pets")
    .select("id")
    .eq("id", parsed.data.pet_id)
    .eq("shelter_id", shelter.id)
    .maybeSingle();

  if (!pet) return { error: "Pet não encontrado neste abrigo." };

  // Cria a adoção e muda status do pet para 'adopted'
  const [{ error: adoptError }, { error: petError }] = await Promise.all([
    supabase.from("adoptions").insert({ ...parsed.data, shelter_id: shelter.id }),
    supabase
      .from("shelter_pets")
      .update({ status: "adopted" })
      .eq("id", parsed.data.pet_id),
  ]);

  if (adoptError) return { error: adoptError.message };
  if (petError) return { error: petError.message };

  revalidatePath("/ong/adocoes");
  revalidatePath("/ong/pets");
  revalidatePath("/ong/dashboard");
  redirect("/ong/adocoes");
}

export async function updateFollowUp(
  adoptionId: string,
  _prev: AdoptionFormState,
  formData: FormData
): Promise<AdoptionFormState> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { error: "Não autenticado." };

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!shelter) return { error: "Sem permissão." };

  const status = formData.get("status") as string;
  const follow_up_30_date = formData.get("follow_up_30_date") as string;
  const follow_up_30_notes = formData.get("follow_up_30_notes") as string;
  const follow_up_90_date = formData.get("follow_up_90_date") as string;
  const follow_up_90_notes = formData.get("follow_up_90_notes") as string;

  const updatePayload: Record<string, string | null> = {
    follow_up_30_date: follow_up_30_date || null,
    follow_up_30_notes: follow_up_30_notes || null,
    follow_up_90_date: follow_up_90_date || null,
    follow_up_90_notes: follow_up_90_notes || null,
  };
  if (status) updatePayload.status = status;

  const { error } = await supabase
    .from("adoptions")
    .update(updatePayload)
    .eq("id", adoptionId)
    .eq("shelter_id", shelter.id);

  if (error) return { error: error.message };

  revalidatePath(`/ong/adocoes/${adoptionId}`);
  return { success: true };
}
