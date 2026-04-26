"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { uploadPetPhoto } from "@/lib/services/pets";
import { createPetSchema, validatePhoto } from "@/lib/validation/pet";
import { parseFormData } from "@/lib/validation/auth";
import type { PetFormState } from "@/components/pets/PetForm";

export async function createPetAction(
  _prev: PetFormState,
  formData: FormData
): Promise<PetFormState> {
  // 1. Valida campos
  const parsed = parseFormData(createPetSchema, formData);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  // 2. Valida e (se houver) faz upload da foto
  const photoFile = formData.get("photo");
  const photoCheck = validatePhoto(
    photoFile instanceof File ? photoFile : null
  );
  if (!photoCheck.ok) {
    return { ok: false, errors: { photo: photoCheck.error } };
  }

  // 3. Identifica dono (se logado) — owner_id = null pra cadastro anônimo
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  const ownerId = user?.id ?? null;

  // 4. Upload da foto (se houver)
  let photoUrl: string | null = null;
  if (photoCheck.file) {
    const upload = await uploadPetPhoto(photoCheck.file, ownerId);
    if (upload.error) {
      return {
        ok: false,
        message: `Falha no upload da foto: ${upload.error}`,
      };
    }
    photoUrl = upload.url;
  }

  // 5. Insert (RLS valida que owner_id bate com auth.uid() ou é null)
  const { data: dataRaw, error } = await supabase
    .from("pets")
    .insert({
      ...parsed.data,
      owner_id: ownerId,
      photo_url: photoUrl,
    })
    .select("id")
    .single();

  const data = dataRaw as { id: string } | null;
  if (error || !data) {
    return {
      ok: false,
      message: error?.message ?? "Erro ao salvar — tente novamente.",
    };
  }

  revalidatePath("/pets");
  if (ownerId) revalidatePath("/meus-pets");
  redirect(`/pets/${data.id}`);
}
