"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getUserSafe } from "@/lib/auth/safe";
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

  // ── 1. Extrair campos ──────────────────────────────────────
  const petName = (formData.get("pet_name") as string | null)?.trim() || null;
  const species = (formData.get("species") as string) || "dog";
  const tagPhone = (formData.get("tag_phone") as string)?.trim() ?? "";
  const ownerName = (formData.get("owner_name") as string)?.trim() ?? "";
  const ownerEmail = (formData.get("owner_email") as string)?.trim() ?? "";
  const photo = formData.get("photo") as File | null;

  const cep = (formData.get("cep") as string)?.trim() ?? "";
  const logradouro = (formData.get("logradouro") as string)?.trim() ?? "";
  const numero = (formData.get("numero") as string)?.trim() ?? "";
  const complemento = (formData.get("complemento") as string)?.trim() ?? "";
  const bairro = (formData.get("bairro") as string)?.trim() ?? "";
  const cidade = (formData.get("cidade") as string)?.trim() ?? "";
  const estado = (formData.get("estado") as string)?.trim() ?? "";

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
