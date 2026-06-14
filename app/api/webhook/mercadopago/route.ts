import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  buscarPagamento,
  validarAssinaturaWebhook,
} from "@/lib/services/mercadopago";
import { sendEmail } from "@/lib/services/email";

// Prioridade: NEXT_PUBLIC_SITE_URL (setada na Vercel) > NEXT_PUBLIC_APP_URL (legado) > fallback local
const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

const SUPPLIER_EMAIL = process.env.SUPPLIER_EMAIL ?? "";

type WebhookOrder = {
  id: string;
  pet_id: string;
  user_id: string | null;
  amount_cents: number;
  tag_contact_phone: string;
  shipping_name: string;
  shipping_address: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
  };
  pets: {
    id: string;
    name: string | null;
    species: string;
    photo_url: string | null;
  } | null;
};

const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'none'; img-src 'self' https: data:; style-src 'unsafe-inline'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'none';",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "X-XSS-Protection": "0",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeText(value: unknown): string {
  return escapeHtml(value == null ? "" : String(value).trim());
}

function responseJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: SECURITY_HEADERS });
}

/**
 * POST /api/webhook/mercadopago
 *
 * Recebe notificações do Mercado Pago.
 * Apenas processa eventos do tipo "payment" com action "payment.updated".
 *
 * Fluxo (pagamento aprovado):
 *  1. Valida assinatura x-signature
 *  2. Busca detalhes do pagamento na API do MP
 *  3. Localiza o pedido via external_reference (orderId)
 *  4. Atualiza payment_status=paid, supplier_status=queued
 *  5. Ativa o pet (status: draft → active)
 *  6. Envia email ao fornecedor com QR code e dados de entrega
 *  7. Envia email de confirmação ao cliente
 *
 * Idempotente: usa payment_id como chave única.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: unknown;

    try {
      body = JSON.parse(rawBody) as unknown;
    } catch {
      return responseJson({ error: "Invalid JSON payload" }, 400);
    }

    const bodyObj = body as Record<string, unknown>;
    const dataObj = bodyObj.data as Record<string, unknown> | undefined;

    const xSig = req.headers.get("x-signature");
    const xReqId = req.headers.get("x-request-id");
    const dataId = safeText(dataObj?.id);

    const valid = await validarAssinaturaWebhook(xSig, xReqId, dataId);
    if (!valid) {
      console.error("[Webhook MP] Assinatura inválida");
      return responseJson({ error: "Invalid signature" }, 401);
    }

    const eventType = safeText(bodyObj.type);
    if (eventType !== "payment") {
      return responseJson({ ok: true });
    }

    const paymentId = safeText(dataObj?.id);
    if (!paymentId) {
      return responseJson({ error: "Missing payment id" }, 400);
    }

    const payment = await buscarPagamento(paymentId);

    if (payment.status !== "approved") {
      if (payment.status === "rejected" || payment.status === "cancelled") {
        const supabase = createServiceClient();
        await supabase
          .from("pet_tag_orders")
          .update({ payment_status: "failed", payment_id: paymentId })
          .eq("preference_id", payment.external_reference)
          .eq("payment_status", "pending_payment");
      }
      return responseJson({ ok: true });
    }

    const supabase = createServiceClient();

    const { data: order, error: orderError } = await supabase
      .from("pet_tag_orders")
      .update({
        payment_status: "paid",
        payment_id: paymentId,
        supplier_status: "queued",
      })
      .eq("id", payment.external_reference)
      .eq("payment_status", "pending_payment")
      .select(
        "id, pet_id, user_id, amount_cents, tag_contact_phone, shipping_name, shipping_address, pets ( id, name, species, photo_url )"
      )
      .single<WebhookOrder>();

    if (orderError || !order) {
      console.log("[Webhook MP] Pedido já processado ou não encontrado:", payment.external_reference);
      return responseJson({ ok: true });
    }

    await supabase
      .from("pets")
      .update({ status: "active" })
      .eq("id", order.pet_id)
      .eq("status", "draft");

    const pet = order.pets;
    const petName = safeText(pet?.name ?? "Sem nome");
    const petUrl = `${APP_URL}/pets/${encodeURIComponent(order.pet_id)}`;
    const safePetUrl = escapeHtml(petUrl);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(petUrl)}&color=FF6B35&bgcolor=0F0F1A`;
    const safeQrUrl = escapeHtml(qrUrl);
    const addr = order.shipping_address;
    const safeOrderId = safeText(order.id.slice(0, 8).toUpperCase());
    const safePhone = safeText(order.tag_contact_phone);
    const safeShippingName = safeText(order.shipping_name);
    const safeLogradouro = safeText(addr.logradouro);
    const safeNumero = safeText(addr.numero);
    const safeComplemento = safeText(addr.complemento);
    const safeBairro = safeText(addr.bairro);
    const safeCidade = safeText(addr.cidade);
    const safeEstado = safeText(addr.estado);
    const safeCep = safeText(addr.cep);
    const safeAppUrl = escapeHtml(APP_URL);
    const safePhotoUrl = pet?.photo_url ? escapeHtml(pet.photo_url) : null;

    if (SUPPLIER_EMAIL) {
      const supplierHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0F0F1A;color:#F1EDE8;border-radius:16px;">
          <h1 style="color:#FF6B35;font-size:22px;margin:0 0 4px">🐾 Novo Pedido — Pet Aumigo</h1>
          <p style="color:#9A8F8A;font-size:14px;margin:0 0 24px">Pedido <strong style="color:#F1EDE8">#${safeOrderId}</strong></p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr style="background:#1A1A2E">
              <td colspan="2" style="padding:12px 16px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#9A8F8A;">
                Dados da Plaquinha
              </td>
            </tr>
            <tr style="border-top:1px solid rgba(255,255,255,0.08)">
              <td style="padding:12px 16px;font-size:14px;color:#9A8F8A;width:140px">Nome do pet</td>
              <td style="padding:12px 16px;font-size:14px;font-weight:bold;color:#F1EDE8">${petName}</td>
            </tr>
            <tr style="border-top:1px solid rgba(255,255,255,0.08);background:#1A1A2E">
              <td style="padding:12px 16px;font-size:14px;color:#9A8F8A">Telefone (gravar)</td>
              <td style="padding:12px 16px;font-size:18px;font-weight:bold;color:#00E5FF">${safePhone}</td>
            </tr>
            <tr style="border-top:1px solid rgba(255,255,255,0.08)">
              <td style="padding:12px 16px;font-size:14px;color:#9A8F8A">QR Code URL</td>
              <td style="padding:12px 16px;font-size:13px;color:#00E5FF;word-break:break-all;">
                <a href="${safePetUrl}" style="color:#00E5FF">${safePetUrl}</a>
              </td>
            </tr>
          </table>

          <div style="text-align:center;margin:24px 0;">
            <p style="font-size:12px;color:#9A8F8A;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px">QR Code para imprimir na plaquinha</p>
            <img src="${safeQrUrl}" alt="QR Code" width="200" height="200" style="border-radius:12px;background:#fff;padding:8px;" />
            <p style="font-size:11px;color:#9A8F8A;margin-top:8px">
              <a href="${safeQrUrl}" style="color:#FF6B35">Download QR Code (400x400px)</a>
            </p>
          </div>

          ${safePhotoUrl ? `
          <div style="text-align:center;margin:24px 0;">
            <p style="font-size:12px;color:#9A8F8A;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px">Foto do pet (referência)</p>
            <img src="${safePhotoUrl}" alt="${petName}" width="160" height="160" style="border-radius:50%;object-fit:cover;border:3px solid #FF6B35;" />
          </div>
          ` : ""}

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr style="background:#1A1A2E">
              <td colspan="2" style="padding:12px 16px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#9A8F8A;">
                Endereço de Entrega
              </td>
            </tr>
            <tr style="border-top:1px solid rgba(255,255,255,0.08)">
              <td style="padding:12px 16px;font-size:14px;color:#9A8F8A;width:140px">Destinatário</td>
              <td style="padding:12px 16px;font-size:14px;font-weight:bold;color:#F1EDE8">${safeShippingName}</td>
            </tr>
            <tr style="border-top:1px solid rgba(255,255,255,0.08);background:#1A1A2E">
              <td style="padding:12px 16px;font-size:14px;color:#9A8F8A">Endereço</td>
              <td style="padding:12px 16px;font-size:14px;color:#F1EDE8">
                ${safeLogradouro}, ${safeNumero}${safeComplemento ? ` — ${safeComplemento}` : ""}<br>
                ${safeBairro} · ${safeCidade} / ${safeEstado}<br>
                CEP: ${safeCep}
              </td>
            </tr>
          </table>

          <p style="font-size:12px;color:#9A8F8A;text-align:center;margin-top:24px;">
            Pedido gerado automaticamente pelo sistema Pet Aumigo.<br>
            Dúvidas? Acesse o painel em <a href="${safeAppUrl}/admin/plaquinhas" style="color:#FF6B35">${safeAppUrl}/admin/plaquinhas</a>
          </p>
        </div>
      `;

      await sendEmail({
        to: SUPPLIER_EMAIL,
        subject: `[Pet Aumigo] Novo pedido #${safeOrderId} — ${petName}`,
        html: supplierHtml,
      }).catch(console.error);

      await supabase
        .from("pet_tag_orders")
        .update({
          supplier_status: "sent_to_supplier",
          supplier_notified_at: new Date().toISOString(),
        })
        .eq("id", order.id);
    }

    const clientEmail = safeText(payment.payer?.email);
    if (clientEmail) {
      const clientHtml = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0F0F1A;color:#F1EDE8;border-radius:16px;">
          <h1 style="color:#FF6B35;font-size:22px;margin:0 0 8px">🎉 Pedido confirmado!</h1>
          <p style="color:#9A8F8A;font-size:14px;margin:0 0 24px">
            Tudo certo com seu pedido. Vamos produzir a plaquinha do <strong style="color:#F1EDE8">${petName}</strong> e enviar para seu endereço.
          </p>

          <div style="background:#1A1A2E;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
            <p style="font-size:12px;color:#9A8F8A;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px">QR Code do seu pet</p>
            <img src="${safeQrUrl}" alt="QR Code" width="160" height="160" style="border-radius:10px;background:#fff;padding:6px;" />
            <p style="font-size:13px;color:#F1EDE8;margin:12px 0 4px">Perfil digital ativo:</p>
            <a href="${safePetUrl}" style="color:#00E5FF;font-size:13px;word-break:break-all">${safePetUrl}</a>
          </div>

          <p style="font-size:13px;color:#9A8F8A;margin-bottom:8px">
            📦 Prazo estimado: <strong style="color:#F1EDE8">7 a 14 dias úteis</strong>
          </p>
          <p style="font-size:13px;color:#9A8F8A;">
            📬 Enviaremos o código de rastreio assim que o pedido for despachado.
          </p>

          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">
          <p style="font-size:11px;color:#9A8F8A;text-align:center;">
            Pet Aumigo · Rede colaborativa de resgate<br>
            <a href="${safeAppUrl}" style="color:#FF6B35">${safeAppUrl}</a>
          </p>
        </div>
      `;

      await sendEmail({
        to: clientEmail,
        subject: `Pedido confirmado! Plaquinha do ${petName} a caminho 🐾`,
        html: clientHtml,
      }).catch(console.error);
    }

    return responseJson({ ok: true });
  } catch (err) {
    console.error("[Webhook MP] Erro interno:", err);
    return responseJson({ error: "Internal server error" }, 500);
  }
}
