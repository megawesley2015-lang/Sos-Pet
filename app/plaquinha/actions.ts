"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient, createServiceClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { criarPreferencia } from "@/lib/services/mercadopago";
import { validatePhoto } from "@/lib/validation/pet";

const TAG_PRICE_BRL = Number(process.env.TAG_PRICE_BRL ?? "39.90");
if (isNaN(TAG_PRICE_BRL) || TAG_PRICE_BRL <= 0) {
  throw new Error("[plaquinha] TAG_PRICE_BRL deve ser um número positivo. Verifique .env.local.");
}
const TAG_PRICE_CENTS = Math.round(TAG_PRICE_BRL * 100);

const phoneRegex = /^[\d\s()+\-]+$/;

const checkoutSchema = z.object({
  pet_name:   z.string().max(60).optional().transform((v) => v?.trim() || null),
  species:    z.enum(["dog", "cat", "other"]).default("dog"),
  tag_phone:  z.string().min(8, "Telefone muito curto").max(20).regex(phoneRegex, "Telefone inválido"),
  owner_name: z.string().min(2, "Informe seu nome").max(80),
  owner_email: z.string().email("E-mail inválido").max(120),
  cep:        z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  logradouro: z.string().min(2, "Informe o logradouro").max(120),
  numero:     z.string().min(1, "Informe o número").max(20),
  complemento: z.string().max(60).optional().transform((v) => v?.trim() || ""),
  bairro:     z.string().min(2, "Informe o bairro").max(80),
  cidade:     z.string().min(2, "Informe a cidade").max(80),
  estado:     z.string().length(2, "Use a sigla do estado (ex: SP)"),
});

/**
 * Server Action — processa o checkout da plaquinha.
 *
 * Fluxo:
 *  1. Valida FormData
 *  2. Faz upload da foto do pet para Supabase Storage
 *  3. Cria pet (status=draft) na tabela pets
 *  4. Cria pedido (payment_status=pending_payment) em pet_tag_orders
 *  5. Cria preferência no Mercado Pago
 *  6. Redireciona para o checkout do MP
 */
export async function iniciarCheckoutPlaquinha(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const serviceClient = createServiceClient();
  const user = await getUserSafe(supabase);

  // ── 1. Validar e extrair campos ────────────────────────────
  const parsed = checkoutSchema.safeParse({
    pet_name:    formData.get("pet_name"),
    species:     formData.get("species"),
    tag_phone:   formData.get("tag_phone"),
    owner_name:  formData.get("owner_name"),
    owner_email: formData.get("owner_email"),
    cep:         formData.get("cep"),
    logradouro:  formData.get("logradouro"),
    numero:      formData.get("numero"),
    complemento: formData.get("complemento"),
    bairro:      formData.get("bairro"),
    cidade:      formData.get("cidade"),
    estado:      formData.get("estado"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos. Revise o formulário.";
    throw new Error(firstError);
  }

  const {
    pet_name: petName, species, tag_phone: tagPhone,
    owner_name: ownerName, owner_email: ownerEmail,
    cep, logradouro, numero, complemento, bairro, cidade, estado,
  } = parsed.data;

  const photo = formData.get("photo") as File | null;

  // ── 2. Upload da foto ──────────────────────────────────────
  // Usa o mesmo validatePhoto de todos os outros fluxos de upload (H-03)
  const photoCheck = validatePhoto(photo instanceof File ? photo : null);
  if (!photoCheck.ok) {
    throw new Error(photoCheck.error);
  }

  const MIME_TO_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  let photoUrl: string | null = null;
  if (photoCheck.file) {
    const ext = MIME_TO_EXT[photoCheck.file.type] ?? "jpg";
    const path = `tags/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error: uploadError } = await serviceClient.storage
      .from("pets")
      .upload(path, photoCheck.file, { contentType: photoCheck.file.type, upsert: false });

    if (!uploadError) {
      const { data: urlData } = serviceClient.storage
        .from("pets")
        .getPublicUrl(path);
      photoUrl = urlData.publicUrl;
    }
  }

  // ── 3. Criar pet (draft) ───────────────────────────────────
  const { data: pet, error: petError } = await serviceClient
    .from("pets")
    .insert({
      name: petName,
      species,
      contact_phone: tagPhone,
      status: "draft",
      kind: "lost", // placeholder — pet de identidade, não de busca
      color: "",
      size: "medium",
      sex: "unknown",
      city: cidade,
      neighborhood: bairro,
      description: `Plaquinha de identificação para ${petName ?? "meu pet"}`,
      ...(user ? { user_id: user.id } : {}),
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .select("id")
    .single();

  if (petError || !pet) {
    throw new Error(`Erro ao criar perfil do pet: ${petError?.message}`);
  }

  // ── 4. Criar pedido ────────────────────────────────────────
  const { data: order, error: orderError } = await serviceClient
    .from("pet_tag_orders")
    .insert({
      pet_id: pet.id,
      user_id: user?.id ?? null,
      amount_cents: TAG_PRICE_CENTS,
      tag_contact_phone: tagPhone,
      shipping_name: ownerName,
      shipping_address: {
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      },
    })
    .select("id")
    .single();

  if (orderError || !order) {
    // Limpar pet criado
    await serviceClient.from("pets").delete().eq("id", pet.id);
    throw new Error(`Erro ao criar pedido: ${orderError?.message}`);
  }

  // ── 5. Criar preferência no MP ────────────────────────────
  const preference = await criarPreferencia({
    orderId: order.id,
    items: [
      {
        id: "plaquinha-standard",
        title: `Plaquinha SOS Pet${petName ? ` — ${petName}` : ""}`,
        quantity: 1,
        unit_price: TAG_PRICE_BRL,
        ...(photoUrl ? { picture_url: photoUrl } : {}),
      },
    ],
    payer: {
      name: ownerName,
      email: ownerEmail,
      phone: { number: tagPhone },
    },
  });

  // Salvar preference_id no pedido
  await serviceClient
    .from("pet_tag_orders")
    .update({ preference_id: preference.id })
    .eq("id", order.id);

  // ── 6. Redirecionar para o MP ─────────────────────────────
  const isProd = process.env.NODE_ENV === "production";
  const checkoutUrl = isProd
    ? preference.init_point
    : preference.sandbox_init_point;

  redirect(checkoutUrl);
}
