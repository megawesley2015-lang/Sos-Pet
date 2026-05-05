/**
 * Mercado Pago — integração via REST API (sem SDK)
 *
 * Docs: https://www.mercadopago.com.br/developers/pt/reference
 *
 * Variáveis de ambiente necessárias:
 *   MP_ACCESS_TOKEN      — token de acesso (server-only, secret)
 *   MP_WEBHOOK_SECRET    — chave para validar assinatura do webhook
 *   NEXT_PUBLIC_MP_PUBLIC_KEY — chave pública (para o SDK client-side, futuro)
 *   NEXT_PUBLIC_APP_URL  — URL base do site (para back_urls e notification_url)
 */

const MP_BASE = "https://api.mercadopago.com";
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN ?? "";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000";

// ─── Tipos ───────────────────────────────────────────────────

export interface MPItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number; // em reais (não centavos)
  currency_id?: string;
  picture_url?: string;
}

export interface MPPayer {
  name: string;
  email: string;
  phone?: { number: string };
}

export interface MPPreferenceInput {
  orderId: string;       // external_reference — id do nosso pedido
  items: MPItem[];
  payer: MPPayer;
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
}

export interface MPPreferenceOutput {
  id: string;            // preference_id
  init_point: string;    // URL de redirecionamento para o checkout MP
  sandbox_init_point: string;
}

// ─── Criar Preferência de Pagamento ──────────────────────────

/**
 * Cria uma preferência de checkout no Mercado Pago.
 * Retorna a URL (init_point) para redirecionar o usuário.
 */
export async function criarPreferencia(
  input: MPPreferenceInput
): Promise<MPPreferenceOutput> {
  if (!ACCESS_TOKEN) {
    throw new Error(
      "[MP] MP_ACCESS_TOKEN não configurado. Configure em .env.local."
    );
  }

  const body = {
    external_reference: input.orderId,
    items: input.items.map((item) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: item.currency_id ?? "BRL",
      ...(item.picture_url ? { picture_url: item.picture_url } : {}),
    })),
    payer: input.payer,
    back_urls: {
      success: input.successUrl ?? `${APP_URL}/plaquinha/sucesso`,
      failure: input.failureUrl ?? `${APP_URL}/plaquinha/falha`,
      pending: input.pendingUrl ?? `${APP_URL}/plaquinha/pendente`,
    },
    auto_return: "approved", // redireciona automaticamente após pagamento aprovado
    notification_url: `${APP_URL}/api/webhook/mercadopago`,
    payment_methods: {
      // Aceitar todos os métodos disponíveis no Brasil
      excluded_payment_types: [], // sem exclusões
      installments: 6,            // máx 6x no cartão
    },
    statement_descriptor: "SOS PET",
    binary_mode: false, // false = aceita pagamentos pending (boleto/PIX)
  };

  const res = await fetch(`${MP_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[MP] Erro ao criar preferência: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
  };
}

// ─── Buscar Pagamento ─────────────────────────────────────────

export interface MPPayment {
  id: number;
  status: "approved" | "pending" | "in_process" | "rejected" | "cancelled" | "refunded";
  status_detail: string;
  external_reference: string; // nosso orderId
  transaction_amount: number;
  payment_method_id: string;
  payment_type_id: string;
  payer: { email: string; first_name: string; last_name: string };
  date_approved: string | null;
}

export async function buscarPagamento(paymentId: string): Promise<MPPayment> {
  const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    // sem cache — dados em tempo real
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[MP] Erro ao buscar pagamento ${paymentId}: ${res.status} — ${err}`);
  }

  return res.json();
}

// ─── Validar Assinatura do Webhook ───────────────────────────

/**
 * Valida a assinatura x-signature enviada pelo MP no webhook.
 * Ref: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 *
 * Retorna true se válida, false caso contrário.
 * Em desenvolvimento (sem MP_WEBHOOK_SECRET), aceita tudo.
 */
export async function validarAssinaturaWebhook(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  rawBody: string
): Promise<boolean> {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    // Fail-closed em produção — sem secret configurado não aceita nenhum webhook.
    if (process.env.NODE_ENV === "production") {
      console.error("[MP] MP_WEBHOOK_SECRET não configurado em produção — rejeitando webhook.");
      return false;
    }
    console.warn("[MP] MP_WEBHOOK_SECRET não configurado — pulando validação (dev only).");
    return true;
  }
  if (!xSignature || !xRequestId) return false;

  // Formato da assinatura: "ts=...,v1=..."
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const idx = p.indexOf("=");
      return [p.slice(0, idx), p.slice(idx + 1)] as [string, string];
    })
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Proteção contra replay attack: rejeitar timestamps com mais de 5 minutos
  const tsMs = Number(ts) * 1000;
  if (Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
    console.warn("[MP] Webhook rejeitado: timestamp fora do intervalo de 5 minutos.");
    return false;
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(manifest)
  );

  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparação em tempo constante — evita timing attack na validação de HMAC
  if (hex.length !== v1.length) return false;
  const a = Buffer.from(hex, "hex");
  const b = Buffer.from(v1, "hex");
  if (a.length !== b.length) return false;
  // timingSafeEqual disponível no runtime Node.js do Next.js
  const { timingSafeEqual } = await import("crypto");
  return timingSafeEqual(a, b);
}
