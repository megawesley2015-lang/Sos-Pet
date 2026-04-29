"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createServiceClient } from "@/lib/supabase/server";
import { notificarAvistamento } from "@/lib/services/email";
import type { PetRow, ProfileRow } from "@/lib/types/database";

export interface RegistrarAvistamentoState {
  error?: string;
  success?: boolean;
}

/**
 * Registra um avistamento de pet.
 * Qualquer pessoa pode reportar — sem autenticação obrigatória.
 * Após salvar, notifica o tutor por email (best-effort, não bloqueia).
 *
 * FormData esperado:
 *   pet_id       string
 *   lat          string (número)
 *   lng          string (número)
 *   address      string (opcional)
 *   description  string (opcional)
 *   photo        File  (opcional)
 */
export async function registrarAvistamentoAction(
  _prev: RegistrarAvistamentoState,
  formData: FormData
): Promise<RegistrarAvistamentoState> {
  const supabase = await createSupabaseServerClient();

  const petId      = formData.get("pet_id")      as string | null;
  const latRaw     = formData.get("lat")          as string | null;
  const lngRaw     = formData.get("lng")          as string | null;
  const address    = (formData.get("address")     as string | null) || null;
  const description = (formData.get("description") as string | null) || null;
  const photo      = formData.get("photo")        as File | null;

  // Validação básica
  if (!petId || !latRaw || !lngRaw) {
    return { error: "Dados incompletos. Tente novamente." };
  }
  const lat = parseFloat(latRaw);
  const lng = parseFloat(lngRaw);
  if (isNaN(lat) || isNaN(lng)) {
    return { error: "Coordenadas inválidas." };
  }

  // Upload da foto (opcional)
  let photo_url: string | null = null;
  if (photo && photo.size > 0) {
    if (!photo.type.startsWith("image/")) {
      return { error: "Arquivo inválido. Envie uma imagem." };
    }
    if (photo.size > 5 * 1024 * 1024) {
      return { error: "Imagem muito grande. Máximo 5 MB." };
    }
    const ext = photo.type.split("/")[1] ?? "jpg";
    const filename = `${petId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("sightings")
      .upload(filename, photo, { contentType: photo.type, upsert: false });

    if (uploadError) {
      console.error("[sightings] upload error:", uploadError);
      return { error: "Erro ao enviar a foto. Tente novamente." };
    }

    const { data: urlData } = supabase.storage.from("sightings").getPublicUrl(filename);
    photo_url = urlData.publicUrl;
  }

  // Insere o avistamento
  const { data: inserted, error: insertError } = await supabase
    .from("sightings")
    .insert({ pet_id: petId, lat, lng, address, photo_url, description })
    .select("id, created_at")
    .single();

  if (insertError) {
    console.error("[sightings] insert error:", insertError);
    return { error: "Erro ao salvar avistamento. Tente novamente." };
  }

  revalidatePath(`/pets/${petId}`);

  // ── Notificação por email ao tutor (best-effort — não bloqueia o retorno) ──
  // Usamos o service client para acessar auth.users (email não está em profiles)
  notificarTutorPorEmail({
    petId,
    address,
    description,
    createdAt: inserted?.created_at ?? new Date().toISOString(),
  }).catch((err) => console.error("[sightings] email error:", err));

  return { success: true };
}

/** Busca dados do tutor e envia o email de notificação de avistamento. */
async function notificarTutorPorEmail(opts: {
  petId: string;
  address: string | null;
  description: string | null;
  createdAt: string;
}) {
  try {
    const service = createServiceClient();

    // Busca o pet para pegar owner_id e nome
    const { data: petRaw } = await service
      .from("pets")
      .select("owner_id, name")
      .eq("id", opts.petId)
      .maybeSingle();

    const pet = petRaw as Pick<PetRow, "owner_id" | "name"> | null;
    if (!pet?.owner_id) return; // pet anônimo, sem dono cadastrado

    // Busca o perfil do tutor para pegar o nome
    const { data: profileRaw } = await service
      .from("profiles")
      .select("full_name")
      .eq("id", pet.owner_id)
      .maybeSingle();

    const profile = profileRaw as Pick<ProfileRow, "full_name"> | null;

    // Busca o email do tutor em auth.users (requer service role)
    const { data: authUser } = await service.auth.admin.getUserById(pet.owner_id);
    const email = authUser?.user?.email;
    if (!email) return;

    await notificarAvistamento({
      tutorEmail: email,
      tutorNome: profile?.full_name ?? null,
      petNome: pet.name ?? null,
      petId: opts.petId,
      address: opts.address,
      description: opts.description,
      createdAt: opts.createdAt,
    });
  } catch (err) {
    console.error("[sightings] notificarTutor error:", err);
  }
}
