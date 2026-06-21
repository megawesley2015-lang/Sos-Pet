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
import { sendEmail } from "@/lib/email/send";
import { petConfirmationTemplate } from "@/lib/email/templates";
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
  // validateTurnstileToken já trata: token ausente, chave não configurada (bypass em dev)
  // e falha na API do Cloudflare. Usuários logados pulam a verificação.
  const turnstileToken = extractTurnstileToken(formData);
  if (!ownerId) {
    const turnstileValidation = await validateTurnstileToken(turnstileToken);
    if (!turnstileValidation.valid) {
      return {
        ok: false,
        message:
          turnstileValidation.error ??
          "Verificação de segurança falhou. Recarregue a página e tente novamente.",
      };
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
        p_state:            parsed.data.state            ?? '',
        p_event_date:       parsed.data.event_date       ?? '',
        p_contact_name:     parsed.data.contact_name     ?? '',
        p_contact_phone:    parsed.data.contact_phone    ?? '',
        p_contact_whatsapp: parsed.data.contact_whatsapp,
        p_name:             parsed.data.name             || undefined,
        p_breed:            parsed.data.breed            || undefined,
        p_size:             parsed.data.size             || undefined,
        p_sex:              parsed.data.sex              || undefined,
        p_age_approx:       parsed.data.age_approx       || undefined,
        p_description:      parsed.data.description      || undefined,
        p_behavior:         parsed.data.behavior         || undefined,
        p_photo_url:        photoUrl                     || undefined,
        p_latitude:         parsed.data.latitude         ?? undefined,
        p_longitude:        parsed.data.longitude        ?? undefined,
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

  // 8. Email de confirmação para tutores autenticados (pet perdido)
  if (ownerId && user?.email && parsed.data.kind === "lost") {
    sendEmail({
      to: user.email,
      subject: `${parsed.data.name ?? "Seu pet"} foi cadastrado — SOS Pet Aumigo`,
      html: petConfirmationTemplate({
        petName: parsed.data.name ?? "Sem nome",
        petId: newPetId,
        photoUrl: photoUrl ?? undefined,
        species: parsed.data.species,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://aumigo.com.br",
      }),
      templateName: "pet_confirmation",
    }).catch((err) => console.error("[createPetAction] Email de confirmação falhou:", err));
  }

  redirect(`/pets/${newPetId}?novo=true`);
}
