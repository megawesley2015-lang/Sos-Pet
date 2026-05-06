import Link from "next/link";
import { ShieldCheck, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";

interface Props {
  petName?: string | null;
}

const EMOJI: Record<string, string> = {
  plaquinha: "🏷️",
  coleira:   "🦺",
  acessorio: "🛡️",
  higiene:   "🧴",
  alimentacao: "🍗",
  geral:     "🛍️",
};

const fmt = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Banner de "Compra de Emergência" — aparece na página de pet perdido.
 * Mostra os 3 produtos em destaque da categoria segurança e um CTA para a loja.
 * Server Component — sem overhead de client.
 */
export async function EmergencyShopBanner({ petName }: Props) {
  const service = createServiceClient();
  const { data: products } = await service
    .from("store_products")
    .select("id, name, price_cents, original_price_cents, photo_url, category")
    .eq("active", true)
    .eq("featured", true)
    .in("category", ["plaquinha", "coleira", "acessorio"])
    .order("sort_order", { ascending: true })
    .limit(3);

  if (!products?.length) return null;

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/10 via-ink-700/60 to-ink-800/80">
      {/* Cabeçalho */}
      <div className="border-b border-brand-500/20 bg-brand-500/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/25">
            <ShieldCheck className="h-5 w-5 text-brand-300" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-fg">
              Evite que isso aconteça de novo
            </p>
            <p className="text-xs text-fg-muted">
              {petName
                ? `Enquanto procura por ${petName}, proteja`
                : "Proteja"}{" "}
              seus outros pets com identificação e rastreamento.
            </p>
          </div>
        </div>
      </div>

      {/* Produtos */}
      <div className="divide-y divide-white/5 px-4 py-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/loja/${product.id}`}
            className="flex items-center gap-3 py-3 transition hover:opacity-80"
          >
            {/* Thumb */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-700/80 text-2xl">
              {product.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.photo_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                EMOJI[product.category] ?? "🛍️"
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">
                {product.name}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-brand-400">
                  {fmt(product.price_cents)}
                </span>
                {product.original_price_cents &&
                  product.original_price_cents > product.price_cents && (
                    <span className="text-xs text-fg-subtle line-through">
                      {fmt(product.original_price_cents)}
                    </span>
                  )}
              </div>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-fg-subtle" />
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="border-t border-brand-500/20 px-4 py-3">
        <Link
          href="/loja?categoria=plaquinha"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-400"
        >
          <ShoppingBag className="h-4 w-4" />
          Ver todos os produtos de segurança
        </Link>
      </div>
    </section>
  );
}
