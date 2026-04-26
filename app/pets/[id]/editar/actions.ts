"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import {
  uploadPetPhoto,
  deletePetPhotoByUrl,
  updatePet,
  deletePet,
  getPetForOwner,
} from "@/lib/services/pets";
import { createPetSchema, validatePhoto } from "@/lib/validation/pet";
import { parseFormData } from "@/lib/validation/auth";
import type { PetFormState } from "@/components/pets/PetForm";

/**
 * Update — RLS faz o gate (owner_id = auth.uid()).
 * Defesa em profundidade: re-buscamos o pet por owner antes de UPDATE
 * pra evitar uma round-trip falhar silenciosa caso o ID tenha mudado.
 */
export async function updatePetAction(
  petId: string,
  _prev: PetFormState,
  formData: FormData
): Promise<PetFormState> {
  const parsed = parseFormData(createPetSchema, formData);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) {
    return { ok: false, message: "Você precisa estar logado para editar." };
  }

  const existing = await getPetForOwner(petId, user.id);
  if (!existing) {
    return {
      ok: false,
      message: "Pet não encontrado ou você não tem permissão para editá-lo.",
    };
  }

  // Tratamento da foto:
  //   - photo_clear=1   → remove a foto antiga e seta photo_url=null
  //   - novo File       → faz upload novo, deleta a antiga, troca a URL
  //   - nada            → mantém a foto atual
  const photoFile = formData.get("photo");
  const photoCheck = validatePhoto(
    photoFile instanceof File ? photoFile : null
  );
  if (!photoCheck.ok) {
    return { ok: false, errors: { photo: photoCheck.error } };
  }
  const cleared = formData.get("photo_clear") === "1";

  let photoUrl: string | null = existing.photo_url;
  if (photoCheck.file) {
    const upload = await uploadPetPhoto(photoCheck.file, user.id);
    if (upload.error) {
      return {
        ok: false,
        message: `Falha no upload: ${upload.error}`,
      };
    }
    if (existing.photo_url) {
      await deletePetPhotoByUrl(existing.photo_url);
    }
    photoUrl = upload.url;
  } else if (cleared) {
    if (existing.photo_url) {
      await deletePetPhotoByUrl(existing.photo_url);
    }
    photoUrl = null;
  }

  const { ok, error } = await updatePet(petId, {
    ...parsed.data,
    photo_url: photoUrl,
  });

  if (!ok) {
    return { ok: false, message: error ?? "Erro ao salvar." };
  }

  revalidatePath("/pets");
  revalidatePath(`/pets/${petId}`);
  revalidatePath("/meus-pets");
  redirect(`/pets/${petId}`);
}

/**
 * Server Action de delete (chamada por form com action= no detail page).
 */
export async function deletePetAction(petId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return;

  const existing = await getPetForOwner(petId, user.id);
  if (!existing) return;

  if (existing.photo_url) {
    await deletePetPhotoByUrl(existing.photo_url);
  }

  await deletePet(petId);

  revalidatePath("/pets");
  revalidatePath("/meus-pets");
  redirect("/meus-pets");
}
