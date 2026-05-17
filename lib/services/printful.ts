/**
 * Printful API — integração de dropshipping
 *
 * Docs: https://developers.printful.com/
 *
 * Variáveis de ambiente:
 *   PRINTFUL_API_KEY — token de autenticação (server-only)
 *   PRINTFUL_WEBHOOK_SECRET — validar webhooks (optional)
 */

const PRINTFUL_BASE = "https://api.printful.com";
const API_KEY = process.env.PRINTFUL_API_KEY ?? "";

// ─── Tipos ───────────────────────────────────────────────────

export interface PrintfulProduct {
  id: number;
  external_id: string | null;
  name: string;
  description: string | null;
  image: string | null;
  category: string;
  created: number;
  updated: number;
  synced: number;
  variants: PrintfulVariant[];
}

export interface PrintfulVariant {
  id: number;
  external_id: string | null;
  sync_product_id: number;
  name: string;
  sku: string;
  color: string | null;
  size: string | null;
  color_code: string | null;
  image: string | null;
  price: number; // em USD
  cost: number; // em USD
  retail_price: number | null; // em USD
  weight: number | null;
  weight_unit: string | null;
}

export interface PrintfulOrder {
  id: number;
  external_id: string | null;
  status: string;
  shipping: string;
  created: number;
  updated: number;
  items: PrintfulOrderItem[];
  recipient: {
    name: string;
    address1: string;
    address2: string | null;
    city: string;
    state_code: string;
    state_name: string;
    country_code: string;
    country_name: string;
    zip: string;
    phone: string | null;
    email: string | null;
  };
}

export interface PrintfulOrderItem {
  id: number;
  external_id: string | null;
  sync_variant_id: number;
  quantity: number;
  price: number;
  cost: number;
  retail_price: number | null;
  currency: string;
  files: Array<{ id: number; type: string; url: string }>;
  options: Array<{ id: string; value: string }>;
  sku: string | null;
  status: string;
  shipment_status: string | null;
  tracking_url: string | null;
}

export interface PrintfulShipment {
  id: number;
  order_id: number;
  status: string;
  shipped_on: number | null;
  delivered_on: number | null;
  note: string | null;
  carrier: string | null;
  service: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  items: Array<{ item_id: number; quantity: number }>;
}

// ─── Listar Produtos (Catálogo) ───────────────────────────────

/**
 * Lista todos os produtos sincronizados no Printful.
 * Retorna: array de produtos com suas variantes (tamanhos, cores, etc).
 */
export async function listPrintfulProducts(): Promise<PrintfulProduct[]> {
  if (!API_KEY) {
    throw new Error("[Printful] PRINTFUL_API_KEY não configurada.");
  }

  const res = await fetch(`${PRINTFUL_BASE}/products`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Printful] Erro ao listar produtos: ${res.status} — ${err}`);
  }

  const data = await res.json() as { result: PrintfulProduct[] };
  return data.result ?? [];
}

/**
 * Busca um produto específico pelo ID.
 */
export async function getPrintfulProduct(productId: number): Promise<PrintfulProduct> {
  if (!API_KEY) {
    throw new Error("[Printful] PRINTFUL_API_KEY não configurada.");
  }

  const res = await fetch(`${PRINTFUL_BASE}/products/${productId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Printful] Erro ao buscar produto ${productId}: ${res.status} — ${err}`);
  }

  const data = await res.json() as { result: PrintfulProduct };
  return data.result;
}

// ─── Criar Pedido ───────────────────────────────────────────────

/**
 * Cria um pedido no Printful.
 */
export async function createPrintfulOrder(input: {
  external_id: string; // nosso order ID
  shipping: string; // "standard", "express", etc.
  recipient: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    sync_variant_id: number; // Printful variant ID
    quantity: number;
    price?: number;
  }>;
}): Promise<PrintfulOrder> {
  if (!API_KEY) {
    throw new Error("[Printful] PRINTFUL_API_KEY não configurada.");
  }

  const res = await fetch(`${PRINTFUL_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Printful] Erro ao criar pedido: ${res.status} — ${err}`);
  }

  const data = await res.json() as { result: PrintfulOrder };
  return data.result;
}

// ─── Rastrear Pedido ───────────────────────────────────────────

/**
 * Busca o status de um pedido já criado.
 */
export async function getPrintfulOrder(orderId: number): Promise<PrintfulOrder> {
  if (!API_KEY) {
    throw new Error("[Printful] PRINTFUL_API_KEY não configurada.");
  }

  const res = await fetch(`${PRINTFUL_BASE}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `[Printful] Erro ao buscar pedido ${orderId}: ${res.status} — ${err}`
    );
  }

  const data = await res.json() as { result: PrintfulOrder };
  return data.result;
}

/**
 * Busca os shipments (rastreamento) de um pedido.
 */
export async function getPrintfulShipments(
  orderId: number
): Promise<PrintfulShipment[]> {
  if (!API_KEY) {
    throw new Error("[Printful] PRINTFUL_API_KEY não configurada.");
  }

  const res = await fetch(`${PRINTFUL_BASE}/orders/${orderId}/shipments`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `[Printful] Erro ao buscar shipments do pedido ${orderId}: ${res.status} — ${err}`
    );
  }

  const data = await res.json() as { result: PrintfulShipment[] };
  return data.result ?? [];
}

// ─── Sincronizar Catálogo ──────────────────────────────────────

/**
 * Sincroniza todos os produtos do Printful para a tabela store_products.
 * - Cria novos produtos
 * - Atualiza existentes
 * - Remove locais que não têm correspondente no Printful (se desejado)
 */
export async function syncPrintfulCatalog(): Promise<{
  created: number;
  updated: number;
  synced_at: string;
}> {
  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();

  try {
    const products = await listPrintfulProducts();
    let created = 0;
    let updated = 0;

    for (const product of products) {
      // Usar a primeira variante como "produto principal" (simplificado)
      // Em produção, você pode querer criar um produto por variante
      const variant = product.variants[0];
      if (!variant) continue;

      // Preço: converter de USD para centavos BRL (assumindo taxa de câmbio)
      // Em produção, usar taxa real via API ou BD
      const USD_TO_BRL = 5.0; // taxa de câmbio aproximada
      const price_cents = Math.round(variant.price * 100 * USD_TO_BRL);
      const original_price_cents = variant.retail_price
        ? Math.round(variant.retail_price * 100 * USD_TO_BRL)
        : null;

      const externalId = `printful-${variant.id}`;

      const { data: existing } = await supabase
        .from("store_products")
        .select("id")
        .eq("id", externalId)
        .maybeSingle();

      if (existing) {
        // Atualizar
        await supabase
          .from("store_products")
          .update({
            name: `${product.name} - ${variant.name}`,
            description: product.description,
            price_cents,
            original_price_cents,
            photo_url: variant.image ?? product.image,
            supplier_name: "Printful",
            category: product.category || "geral",
            external_url: null, // Printful não expõe URL pública
            updated_at: new Date().toISOString(),
          })
          .eq("id", externalId);
        updated++;
      } else {
        // Criar
        await supabase.from("store_products").insert({
          id: externalId,
          name: `${product.name} - ${variant.name}`,
          description: product.description,
          price_cents,
          original_price_cents,
          photo_url: variant.image ?? product.image,
          supplier_name: "Printful",
          category: product.category || "geral",
          checkout_type: "external",
          external_url: null,
          active: true,
          featured: false,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        created++;
      }
    }

    return {
      created,
      updated,
      synced_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Printful] Erro na sincronização:", error);
    throw error;
  }
}
