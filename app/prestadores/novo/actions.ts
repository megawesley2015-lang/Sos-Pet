"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import {
  generateUniqueSlug,
  uploadProviderPhoto,
} from "@/lib/services/providers";
import { createProviderSchema } from "@/lib/validation/provider";
import { validatePhoto } from "@/lib/validation/pet"; // reaproveita helper de validação de foto
import { parseFormData } from "@/lib/validation/auth";
import type { PrestadorFormState } from "@/components/providers/PrestadorForm";

export async function createProviderAction(
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
    return {
      ok: false,
      message: "Você precisa estar logado para cadastrar um prestador.",
    };
  }

  // Validações de foto
  const logoFile = formData.get("logo");
  const capaFile = formData.get("capa");
  const logoCheck = validatePhoto(logoFile instanceof File ? logoFile : null);
  if (!logoCheck.ok) return { ok: false, errors: { logo: logoCheck.error } };
  const capaCheck = validatePhoto(capaFile instanceof File ? capaFile : null);
  if (!capaCheck.ok) return { ok: false, errors: { capa: capaCheck.error } };

  // Uploads (se houver)
  let logoUrl: string | null = null;
  let capaUrl: string | null = null;
  if (logoCheck.file) {
    const up = await uploadProviderPhoto(logoCheck.file, user.id, "logo");
    if (up.error) return { ok: false, message: `Falha logo: ${up.error}` };
    logoUrl = up.url;
  }
  if (capaCheck.file) {
    const up = await uploadProviderPhoto(capaCheck.file, user.id, "capa");
    if (up.error) return { ok: false, message: `Falha capa: ${up.error}` };
    capaUrl = up.url;
  }

  // Slug único
  const slug = await generateUniqueSlug(parsed.data.nome);

  const { error } = await supabase.from("prestadores").insert({
    ...parsed.data,
    user_id: user.id,
    slug,
    logo_url: logoUrl,
    capa_url: capaUrl,
    status: "pendente_aprovacao",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/prestadores");
  // Redireciona para o dashboard — perfil ainda está pendente de aprovação
  redirect("/dashboard-prestador");
}
