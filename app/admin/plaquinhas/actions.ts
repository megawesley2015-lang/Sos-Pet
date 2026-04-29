"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/services/email";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000";

const SUPPLIER_EMAIL = process.env.SUPPLIER_EMAIL ?? "";

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (data?.role !== "admin") redirect("/");
  return createServiceClient();
}

/** Reenvia o email de notificação ao fornecedor para um pedido específico. */
export async function renotificarFornecedorAction(formData: FormData) {
  const service = await assertAdmin();
  const orderId = formData.get("orderId") as string;

  const { data: order } = await service
    .from("pet_tag_orders")
    .select(`
      id, tag_contact_phone, shipping_name, shipping_address,
      pets ( id, name, photo_url )
    `)
    .eq("id", orderId)
    .single();

  if (!order || !SUPPLIER_EMAIL) return;

  const pet = order.pets as { id: string; name: string | null; photo_url: string | null } | null;
  const petName = pet?.name ?? "Sem nome";
  const petUrl = `${APP_URL}/pets/${pet?.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(petUrl)}`;
  const addr = order.shipping_address as Record<string, string>;

  await sendEmail({
    to: SUPPLIER_EMAIL,
    subject: `[REENVIO] SOS Pet — Pedido #${orderId.slice(0, 8).toUpperCase()} — ${petName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0F0F1A;color:#F1EDE8;border-radius:16px;">
        <h1 style="color:#FF6B35">🔄 Reenvio — Pedido #${orderId.slice(0, 8).toUpperCase()}</h1>
        <p style="color:#9A8F8A">Pet: <strong style="color:#F1EDE8">${petName}</strong></p>
        <p style="color:#9A8F8A">Telefone: <strong style="color:#00E5FF;font-size:18px">${order.tag_contact_phone}</strong></p>
        <p style="color:#9A8F8A">QR: <a href="${petUrl}" style="color:#00E5FF">${petUrl}</a></p>
        <div style="text-align:center;margin:20px 0">
          <img src="${qrUrl}" width="200" height="200" style="border-radius:10px;background:#fff;padding:6px;" />
        </div>
        <p style="color:#9A8F8A">Endereço: ${addr.logradouro}, ${addr.numero} — ${addr.bairro}, ${addr.cidade}/${addr.estado} · CEP ${addr.cep}</p>
        <p style="color:#9A8F8A">Destinatário: ${order.shipping_name}</p>
      </div>
    `,
  });

  await service
    .from("pet_tag_orders")
    .update({
      supplier_status: "sent_to_supplier",
      supplier_notified_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  revalidatePath("/admin/plaquinhas");
}

/** Atualiza o código de rastreio de um pedido. */
export async function atualizarRastreioAction(formData: FormData) {
  const service = await assertAdmin();
  const orderId = formData.get("orderId") as string;
  const trackingCode = formData.get("trackingCode") as string;

  await service
    .from("pet_tag_orders")
    .update({
      tracking_code: trackingCode,
      supplier_status: "shipped",
      shipped_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  revalidatePath("/admin/plaquinhas");
}
