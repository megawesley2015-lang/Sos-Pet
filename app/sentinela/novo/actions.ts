"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

const SENTINEL_TYPES = [
  "pet_shop", "vet", "condo", "market",
  "pharmacy", "gas_station", "school", "park", "other",
] as const;

const SentinelaSchema = z.object({
  name:          z.string().min(2, "Nome obrigatório").max(120),
  type:          z.enum(SENTINEL_TYPES, { message: "Tipo inválido" }),
  address:       z.string().max(200).optional(),
  neighborhood:  z.string().max(100).optional(),
  city:          z.string().min(2, "Cidade obrigatória").max(100),
  contact_phone: z.string().max(20).optional(),
  contact_email: z.string().email("E-mail inválido").max(120).optional().or(z.literal("")),
  has_cameras:   z.preprocess((v) => v === "true" || v === true, z.boolean()),
  latitude:  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(-90).max(90, "Latitude inválida")
  ),
  longitude: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(-180).max(180, "Longitude inválida")
  ),
});

export type SentinelaFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

/**
 * Cadastra um estabelecimento como parceiro da Rede Sentinela.
 * Aberto para qualquer pessoa — sem login. Registro entra como verified=false.
 * A verificação é manual (admin confirma presença física / câmeras).
 *
 * Usa serviceClient para bypass de RLS (anon não tem permissão de INSERT direto).
 */
export async function cadastrarSentinela(
  _prev: SentinelaFormState,
  formData: FormData
): Promise<SentinelaFormState> {
  const raw: Record<string, unknown> = {};
  formData.forEach((v, k) => {
    if (v !== "") raw[k] = v;
  });

  const parsed = SentinelaSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  const supabase = createServiceClient();
  const { error } = await supabase.from("sentinel_partners").insert({
    name:          d.name,
    type:          d.type,
    address:       d.address ?? null,
    neighborhood:  d.neighborhood ?? null,
    city:          d.city,
    contact_phone: d.contact_phone ?? null,
    contact_email: d.contact_email || null,
    has_cameras:   d.has_cameras,
    latitude:      d.latitude,
    longitude:     d.longitude,
    is_active:     true,
    verified:      false,
  });

  if (error) {
    console.error("[sentinela/novo] insert error:", error.message);
    return { error: "Erro ao salvar. Tente novamente." };
  }

  revalidatePath("/mapa");
  revalidatePath("/sentinela");

  return { success: true };
}

export { SENTINEL_TYPES };
