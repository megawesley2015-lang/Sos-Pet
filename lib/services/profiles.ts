/**
 * Service layer — perfil do user (tabela profiles).
 */
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import type { ProfileRow, ProfileUpdate } from "@/lib/types/database";

/**
 * Busca o perfil do usuário autenticado.
 * React.cache deduplica chamadas dentro do mesmo request —
 * TopBar, página e layout não disparam queries duplicadas.
 */
export const getMyProfile = cache(async (): Promise<ProfileRow | null> => {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (data as ProfileRow | null) ?? null;
});

export async function updateMyProfile(
  patch: ProfileUpdate
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { ok: false, error: "Não autenticado." };

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);
  return { ok: !error, error: error?.message ?? null };
}

/**
 * Upload de avatar — bucket avatars.
 * Path: <auth.uid()>/avatar-<timestamp>.<ext>
 */
export async function uploadAvatar(
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { url: null, error: "Não autenticado." };

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const filename = `${user.id}/avatar-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(filename, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (upErr) return { url: null, error: upErr.message };

  const { data } = supabase.storage.from("avatars").getPublicUrl(filename);
  return { url: data.publicUrl, error: null };
}

export async function deleteAvatarByUrl(publicUrl: string): Promise<void> {
  try {
    const url = new URL(publicUrl);
    const marker = "/storage/v1/object/public/avatars/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return;
    const path = url.pathname.slice(idx + marker.length);
    if (!path) return;

    const supabase = await createSupabaseServerClient();
    await supabase.storage.from("avatars").remove([path]);
  } catch {
    /* best effort */
  }
}
