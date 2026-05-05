/**
 * Service layer — Central de Resgate (alertas SOS).
 */
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { getPetForOwner } from "@/lib/services/pets";
import type { AlertSosRow } from "@/lib/types/database";
import type { CreateAlertInput } from "@/lib/validation/alert";

export async function createAlert(
  input: CreateAlertInput,
  imagemUrl: string | null
): Promise<{ alert: AlertSosRow | null; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) {
    return { alert: null, error: "Você precisa estar logado para disparar um SOS." };
  }

  // Garantia: o pet existe, é do user, e está marcado como perdido
  const pet = await getPetForOwner(input.pet_id, user.id);
  if (!pet) {
    return {
      alert: null,
      error: "Pet não encontrado ou você não é o dono do registro.",
    };
  }
  if (pet.kind !== "lost") {
    return {
      alert: null,
      error: "Só é possível disparar SOS para pets marcados como perdidos.",
    };
  }

  const { data, error } = await supabase
    .from("alertas_sos")
    .insert({
      pet_id: input.pet_id,
      user_id: user.id,
      raio_km: input.raio_km,
      mensagem: input.mensagem,
      imagem_url: imagemUrl,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { alert: null, error: error?.message ?? "Erro ao criar alerta." };
  }
  return { alert: data as unknown as AlertSosRow, error: null };
}

export const listAlertsByPet = cache(async (petId: string): Promise<AlertSosRow[]> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("alertas_sos")
    .select("*")
    .eq("pet_id", petId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as AlertSosRow[] | null) ?? [];
});

export async function listMyAlerts(): Promise<AlertSosRow[]> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return [];
  const { data } = await supabase
    .from("alertas_sos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as AlertSosRow[] | null) ?? [];
}

/**
 * Upload do PNG do card SOS gerado no client.
 * Path: <auth.uid()>/<timestamp>-<random>.png
 * RLS: alert_cards_authed_upload exige que o primeiro segmento bata com auth.uid().
 */
export async function uploadAlertCard(
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { url: null, error: "Não autenticado." };

  const filename = `${user.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.png`;

  const { error: upErr } = await supabase.storage
    .from("alert-cards")
    .upload(filename, file, {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: false,
    });

  if (upErr) return { url: null, error: upErr.message };

  const { data } = supabase.storage.from("alert-cards").getPublicUrl(filename);
  return { url: data.publicUrl, error: null };
}

export async function updateAlertStatus(
  alertId: string,
  status: "ativo" | "resolvido" | "cancelado"
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("alertas_sos")
    .update({ status })
    .eq("id", alertId);
  return { ok: !error, error: error?.message ?? null };
}
