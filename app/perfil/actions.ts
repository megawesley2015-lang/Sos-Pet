"use server";

import { revalidatePath } from "next/cache";
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  deleteAvatarByUrl,
} from "@/lib/services/profiles";
import { updateProfileSchema } from "@/lib/validation/profile";
import { validatePhoto } from "@/lib/validation/pet";
import { parseFormData } from "@/lib/validation/auth";

export interface ProfileState {
  ok?: boolean;
  errors?: Record<string, string>;
  message?: string;
}

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const parsed = parseFormData(updateProfileSchema, formData);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  const current = await getMyProfile();
  if (!current) {
    return { ok: false, message: "Sessão expirada. Faça login de novo." };
  }

  // Avatar
  let avatarUrl = current.avatar_url;
  const avatarFile = formData.get("avatar");
  const avatarCheck = validatePhoto(
    avatarFile instanceof File ? avatarFile : null
  );
  if (!avatarCheck.ok) {
    return { ok: false, errors: { avatar: avatarCheck.error } };
  }
  const cleared = formData.get("avatar_clear") === "1";
  if (avatarCheck.file) {
    const up = await uploadAvatar(avatarCheck.file);
    if (up.error) {
      return { ok: false, message: `Falha no avatar: ${up.error}` };
    }
    if (current.avatar_url) await deleteAvatarByUrl(current.avatar_url);
    avatarUrl = up.url;
  } else if (cleared) {
    if (current.avatar_url) await deleteAvatarByUrl(current.avatar_url);
    avatarUrl = null;
  }

  const { ok, error } = await updateMyProfile({
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    avatar_url: avatarUrl,
  });

  if (!ok) {
    return { ok: false, message: error ?? "Erro ao salvar." };
  }

  // Re-render TopBar e qualquer página que mostre nome/avatar
  revalidatePath("/", "layout");

  return { ok: true, message: "Perfil atualizado!" };
}
