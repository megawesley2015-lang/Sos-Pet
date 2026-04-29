"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface RegistrarAvistamentoState {
  error?: string;
  success?: boolean;
}

/**
 * Registra um avistamento de pet.
 * Qualquer pessoa pode reportar — sem autenticação obrigatória.
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

  const petId = formData.get("pet_id") as string | null;
  const latRaw = formData.get("lat") as string | null;
  const lngRaw = formData.get("lng") as string | null;
  const address = (formData.get("address") as string | null) || null;
  const description = (formData.get("description") as string | null) || null;
  const photo = formData.get("photo") as File | null;

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
    // Valida tipo e tamanho
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
      .upload(filename, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[sightings] upload error:", uploadError);
      return { error: "Erro ao enviar a foto. Tente novamente." };
    }

    const { data: urlData } = supabase.storage
      .from("sightings")
      .getPublicUrl(filename);

    photo_url = urlData.publicUrl;
  }

  // Insere na tabela
  const { error: insertError } = await supabase.from("sightings").insert({
    pet_id: petId,
    lat,
    lng,
    address,
    photo_url,
    description,
  });

  if (insertError) {
    console.error("[sightings] insert error:", insertError);
    return { error: "Erro ao salvar avistamento. Tente novamente." };
  }

  revalidatePath(`/pets/${petId}`);
  return { success: true };
}
