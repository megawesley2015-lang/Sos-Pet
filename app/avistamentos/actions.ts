"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";

const SightingSchema = z.object({
  pet_id: z.string().uuid("Pet inválido"),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  address: z.string().max(300).optional(),
  description: z.string().max(500).optional(),
  reporter_name: z.string().max(100).optional(),
});

export type SightingFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

/**
 * Registra um avistamento — sem login obrigatório.
 * Usa serviceClient porque anônimos não têm JWT para RLS.
 * RLS policy na tabela sightings: INSERT habilitado para anon (sem verificação de user_id).
 */
export async function registrarAvistamento(
  _prev: SightingFormState,
  formData: FormData
): Promise<SightingFormState> {
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => v !== "")
  );

  const parsed = SightingSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Verifica que o pet existe e está ativo
  const supabase = createServiceClient();
  const { data: pet } = await supabase
    .from("pets")
    .select("id, name, status")
    .eq("id", parsed.data.pet_id)
    .eq("status", "active")
    .maybeSingle();

  if (!pet) {
    return { error: "Pet não encontrado ou não está ativo na rede." };
  }

  const { error } = await supabase.from("sightings").insert({
    pet_id: parsed.data.pet_id,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    address: parsed.data.address ?? null,
    description: parsed.data.description ?? null,
    reporter_name: parsed.data.reporter_name ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/pets/${parsed.data.pet_id}`);
  revalidatePath("/avistamentos");

  return { success: true };
}

/**
 * Busca avistamentos recentes (últimos 30 dias) para a listagem pública.
 * Usa o cliente SSR (anon key + RLS) — sightings tem SELECT público.
 */
export async function listarAvistamentosRecentes(petId?: string) {
  const supabase = await createSupabaseServerClient();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("sightings")
    .select(`
      id, created_at, pet_id, lat, lng, address, description, reporter_name,
      pets!sightings_pet_id_fkey(id, name, species, photo_url, city, neighborhood, kind, status)
    `)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(50);

  if (petId) query = query.eq("pet_id", petId);

  const { data, error } = await query;
  if (error) console.error("[avistamentos] listarAvistamentosRecentes:", error.message);
  return data ?? [];
}
