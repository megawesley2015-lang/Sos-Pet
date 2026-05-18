"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { uploadPetPhoto } from "@/lib/services/pets";
import { createPetSchema, validatePhoto } from "@/lib/validation/pet";
import { parseFormData } from "@/lib/validation/auth";
import { validateTurnstileToken } from "@/lib/services/turnstile";
import { triggerPetMatching } from "@/lib/services/matching";
import { extractTurnstileToken } from "@/lib/utils/turnstile";
import type { PetFormState } from "@/components/pets/PetForm";

export async function createPetAction(
  _prev: PetFormState,
  formData: FormData
): Promise<PetFormState> {
  // 0. Bot trap anti-spam para cadastros anônimos.
  const botTrap = formData.get("website");
  if (typeof botTrap === "string" && botTrap.trim().length > 0) {
    return {
      ok: false,
      message: "Falha na validação do formulário. Tente novamente.",
    };
  }

  // 1. Identifica dono (se logado) — owner_id = null pra cadastro anônimo
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  const ownerId = user?.id ?? null;

  // 2. Turnstile: OBRIGATÓRIO para anônimos.
  const turnstileToken = extractTurnstileToken(formData);
  if (!ownerId) {
    if (!turnstileToken) {
      return {
        ok: false,
        message:
          "Captcha obrigatório para cadastro sem conta. Recarregue a página e tente novamente.",
      };
    }
    const turnstileValidation = await validateTurnstileToken(turnstileToken);
    if (!turnstileValidation.valid) {
      return {
        ok: false,
        message: turnstileValidation.error ?? "Falha na validação do captcha",
      };
    }
  } else if (turnstileToken) {
    const turnstileValidation = await validateTurnstileToken(turnstileToken);
    if (!turnstileValidation.valid) {
      console.warn(
        "[createPetAction] Turnstile inválido para user logado — prosseguindo:",
        turnstileValidation.error
      );
    }
  }

  // 3. Valida campos
  const parsed = parseFormData(createPetSchema, formData);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  // 4. Valida e (se houver) faz upload da foto
  const photoFile = formData.get("photo");
  const photoCheck = validatePhoto(
    photoFile instanceof File ? photoFile : null
  );
  if (!photoCheck.ok) {
    return { ok: false, errors: { photo: photoCheck.error } };
  }

  // 5. Upload da foto (se houver)
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

  // 6. Insert.
  let newPetId: string | null = null;

  if (ownerId) {
    const { latitude, longitude, ...petData } = parsed.data;
    const { data: dataRaw, error } = await supabase
      .from("pets")
      .insert({
        ...petData,
        owner_id: ownerId,
        photo_url: photoUrl,
        latitude:  latitude  ?? null,
        longitude: longitude ?? null,
      })
      .select("id")
      .single();

    const row = dataRaw as { id: string } | null;
    if (error || !row) {
      return {
        ok: false,
        message: error?.message ?? "Erro ao salvar — tente novamente.",
      };
    }
    newPetId = row.id;
  } else {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "create_pet_anon",
      {
        p_kind:             parsed.data.kind,
        p_species:          parsed.data.species,
        p_color:            parsed.data.color,
        p_neighborhood:     parsed.data.neighborhood,
        p_city:             parsed.data.city,
        p_state:            parsed.data.state,
        p_event_date:       parsed.data.event_date,
        p_contact_name:     parsed.data.contact_name,
        p_contact_phone:    parsed.data.contact_phone,
        p_contact_whatsapp: parsed.data.contact_whatsapp,
        p_name:             parsed.data.name,
        p_breed:            parsed.data.breed,
        p_size:             parsed.data.size,
        p_sex:              parsed.data.sex,
        p_age_approx:       parsed.data.age_approx,
        p_description:      parsed.data.description,
        p_behavior:         parsed.data.behavior,
        p_photo_url:        photoUrl,
        p_latitude:         parsed.data.latitude  ?? null,
        p_longitude:        parsed.data.longitude ?? null,
      }
    );

    if (rpcError || !rpcData) {
      console.error("[createPetAction] RPC create_pet_anon falhou:", rpcError);
      return {
        ok: false,
        message: rpcError?.message ?? "Erro ao salvar — tente novamente.",
      };
    }
    newPetId = rpcData as unknown as string;
  }

  if (!newPetId) {
    return { ok: false, message: "Erro ao salvar — tente novamente." };
  }

  revalidatePath("/pets");
  if (ownerId) revalidatePath("/meus-pets");

  // 7. Dispara matching automático (background)
  triggerPetMatching(newPetId).catch((err) => {
    console.error("[createPetAction] Erro ao disparar matching:", err);
  });

  redirect(`/pets/${newPetId}`);
}
