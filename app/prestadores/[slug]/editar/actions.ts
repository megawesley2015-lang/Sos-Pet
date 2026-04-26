"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import {
  uploadProviderPhoto,
  deleteProviderPhotoByUrl,
  updateProvider,
  deleteProvider,
  getProviderForOwner,
} from "@/lib/services/providers";
import { createProviderSchema } from "@/lib/validation/provider";
import { validatePhoto } from "@/lib/validation/pet";
import { parseFormData } from "@/lib/validation/auth";
import type { PrestadorFormState } from "@/components/providers/PrestadorForm";

export async function updateProviderAction(
  providerId: string,
  slug: string,
  _prev: PrestadorFormState,
  formData: FormData
): Promise<PrestadorFormState> {
  const parsed = parseFormData(createProviderSchema, formData);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) {
    return { ok: false, message: "Você precisa estar logado." };
  }

  const existing = await getProviderForOwner(providerId, user.id);
  if (!existing) {
    return {
      ok: false,
      message: "Prestador não encontrado ou você não tem permissão.",
    };
  }

  // Foto handling — logo
  let logoUrl = existing.logo_url;
  const logoFile = formData.get("logo");
  const logoCheck = validatePhoto(logoFile instanceof File ? logoFile : null);
  if (!logoCheck.ok) return { ok: false, errors: { logo: logoCheck.error } };
  const logoCleared = formData.get("logo_clear") === "1";
  if (logoCheck.file) {
    const up = await uploadProviderPhoto(logoCheck.file, user.id, "logo");
    if (up.error) return { ok: false, message: `Falha logo: ${up.error}` };
    if (existing.logo_url) await deleteProviderPhotoByUrl(existing.logo_url);
    logoUrl = up.url;
  } else if (logoCleared) {
    if (existing.logo_url) await deleteProviderPhotoByUrl(existing.logo_url);
    logoUrl = null;
  }

  // Foto handling — capa
  let capaUrl = existing.capa_url;
  const capaFile = formData.get("capa");
  const capaCheck = validatePhoto(capaFile instanceof File ? capaFile : null);
  if (!capaCheck.ok) return { ok: false, errors: { capa: capaCheck.error } };
  const capaCleared = formData.get("capa_clear") === "1";
  if (capaCheck.file) {
    const up = await uploadProviderPhoto(capaCheck.file, user.id, "capa");
    if (up.error) return { ok: false, message: `Falha capa: ${up.error}` };
    if (existing.capa_url) await deleteProviderPhotoByUrl(existing.capa_url);
    capaUrl = up.url;
  } else if (capaCleared) {
    if (existing.capa_url) await deleteProviderPhotoByUrl(existing.capa_url);
    capaUrl = null;
  }

  const { ok, error } = await updateProvider(providerId, {
    ...parsed.data,
    logo_url: logoUrl,
    capa_url: capaUrl,
  });

  if (!ok) {
    return { ok: false, message: error ?? "Erro ao salvar." };
  }

  revalidatePath("/prestadores");
  revalidatePath(`/prestadores/${slug}`);
  redirect(`/prestadores/${slug}`);
}

export async function deleteProviderAction(
  providerId: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return;

  const existing = await getProviderForOwner(providerId, user.id);
  if (!existing) return;

  // Limpa fotos antes
  if (existing.logo_url) await deleteProviderPhotoByUrl(existing.logo_url);
  if (existing.capa_url) await deleteProviderPhotoByUrl(existing.capa_url);

  await deleteProvider(providerId);

  revalidatePath("/prestadores");
  redirect("/prestadores");
}
