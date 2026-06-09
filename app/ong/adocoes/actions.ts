"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { AdoptionSchema } from "@/lib/validation/ong";

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

  // Fire-and-forget — não bloqueia redirect nem falha se n8n estiver indisponível
  const webhookUrl = process.env.N8N_ADOPTION_WEBHOOK_URL;
  if (webhookUrl && adoptError === undefined) {
    const adoptionId = (await supabase
      .from("adoptions")
      .select("id")
      .eq("pet_id", parsed.data.pet_id)
      .eq("shelter_id", shelter.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()).data?.id;

    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "adoption_created",
        adoption_id: adoptionId ?? null,
        pet_id: parsed.data.pet_id,
        shelter_id: shelter.id,
        adopter_contact: parsed.data.adopter_phone,
        adoption_date: parsed.data.adoption_date,
      }),
      signal: AbortSignal.timeout(5000),
    }).catch((err: unknown) => {
      console.error("[adoption webhook]", err instanceof Error ? err.message : err);
    });
  }

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updatePayload as any)
    .eq("id", adoptionId)
    .eq("shelter_id", shelter.id);

  if (error) return { error: error.message };

  revalidatePath(`/ong/adocoes/${adoptionId}`);
  return { success: true };
}
