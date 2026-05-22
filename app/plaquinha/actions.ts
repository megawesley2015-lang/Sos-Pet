"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, createServiceClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { parseFormData } from "@/lib/validation/auth";
import { plaquinhaCheckoutSchema } from "@/lib/validation/store";
import { criarPreferencia } from "@/lib/services/mercadopago";

const TAG_PRICE_BRL = Number(process.env.TAG_PRICE_BRL ?? "39.90");
const TAG_PRICE_CENTS = Math.round(TAG_PRICE_BRL * 100);

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

  // ── 1. Validar campos ──────────────────────────────────────
  const parsed = parseFormData(plaquinhaCheckoutSchema, formData);
  if (!parsed.ok) {
    throw new Error(Object.values(parsed.errors).join(" | "));
  }
  const {
    pet_name: petName,
    species,
    tag_phone: tagPhone,
    owner_name: ownerName,
    owner_email: ownerEmail,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
  } = parsed.data;
  const photo = formData.get("photo") as File | null;

  // ── 2. Upload da foto ──────────────────────────────────────
  let photoUrl: string | null = null;
  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop() ?? "jpg";
    const path = `tags/${Date.now()}.${ext}`;
    const { error: uploadError } = await serviceClient.storage
      .from("pets")
      .upload(path, photo, { contentType: photo.type, upsert: false });

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
      event_date: new Date().toISOString().slice(0, 10),
      contact_name: ownerName,
      contact_whatsapp: true,
      description: `Plaquinha de identificação para ${petName ?? "meu pet"}`,
      ...(user ? { owner_id: user.id } : {}),
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
        complemento: complemento ?? null,
        bairro,
        cidade,
        estado,
      },
    })
    .select("id")
    .single();

  if (orderError || !order) {
    // Limpar pet criado
    await serviceClient.from("pets").delete().eq("id", pet.id as string);
    throw new Error(`Erro ao criar pedido: ${orderError?.message}`);
  }

  const typedOrder = order as unknown as { id: string };

  // ── 5. Criar preferência no MP ────────────────────────────
  // Prioridade: NEXT_PUBLIC_SITE_URL (setada na Vercel) > NEXT_PUBLIC_APP_URL (legado) > fallback local
  const APP_URL =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const preference = await criarPreferencia({
    orderId: typedOrder.id,
    // Inclui pet.id na successUrl para que a página de sucesso
    // possa linkar diretamente para o perfil digital do pet.
    successUrl: `${APP_URL}/plaquinha/sucesso?pet=${pet.id}`,
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
    .eq("id", typedOrder.id);

  // ── 6. Redirecionar para o MP ─────────────────────────────
  const isProd = process.env.NODE_ENV === "production";
  const checkoutUrl = isProd
    ? preference.init_point
    : preference.sandbox_init_point;

  redirect(checkoutUrl);
}
