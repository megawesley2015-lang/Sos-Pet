import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ShoppingBag, Star, ExternalLink, Tag, Shield, Package, Stethoscope } from "lucide-react";
import { ClubSOSBanner } from "@/components/store/ClubSOSBanner";
import { ProductImage } from "@/components/store/ProductImage";
import type { StoreProductRow } from "@/lib/types/database";

export const metadata = {
  title: "Loja",
  description:
    "Produtos selecionados para segurança, saúde e bem-estar do seu pet. Curadoria especializada para tutores da Baixada Santista.",
};

const CATEGORIA_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  seguranca: { label: "Segurança", icon: "🔐", color: "text-brand-400 bg-brand-500/10 border-brand-500/30" },
  saude:     { label: "Saúde",     icon: "💊", color: "text-[#0F6E56] bg-[#E1F5EE] border-[#20B2AA]/40" },
  higiene:   { label: "Higiene",   icon: "🛁", color: "text-green-400 bg-green-500/10 border-green-500/30" },
  alimentacao: { label: "Alimentação", icon: "🍗", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
  acessorio: { label: "Acessórios", icon: "🎽", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  plaquinha: { label: "Plaquinha QR", icon: "🏷️", color: "text-brand-400 bg-brand-500/10 border-brand-500/30" },
  geral:     { label: "Geral",     icon: "📦", color: "text-fg-muted bg-white/5 border-white/10" },
};

export default async function LojaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const service = createServiceClient();

  let query = service
    .from("store_products")
    .select("*")
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true });

  if (categoria) {
    query = query.eq("category", categoria);
  }

  const { data: products } = await query;

  const { data: allProducts } = await service
    .from("store_products")
    .select("category")
    .eq("active", true);

  const categorias = [
    ...new Set((allProducts?.map((p) => p.category) ?? []) as string[]),
  ];

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const featured = products?.filter((p) => p.featured) ?? [];
  const regular = products?.filter((p) => !p.featured) ?? [];

  return (
    <div className="min-h-screen text-fg" data-theme="light">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-ink-700 to-ink-800 px-4 py-14 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/15 shadow-glow-brand">
            <ShoppingBag className="h-8 w-8 text-brand-400" />
          </div>
          <h1 className="font-display text-4xl font-black text-fg">
            Loja <span className="text-brand-500">SOS Pet</span>
          </h1>
          <p className="mt-3 text-base text-fg-muted">
            Produtos curados para{" "}
            <span className="font-semibold text-fg">segurança, saúde e bem-estar</span> do
            seu pet. Selecionados especialmente para tutores da Baixada Santista.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-fg-subtle">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-green-400" />
              Produtos verificados
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-brand-500" />
              Entrega em 1–7 dias úteis
            </span>
            <span className="flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-purple-400" />
              Indicados por veterinários
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Filtros por categoria — visual */}
        {categorias.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/loja"
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                !categoria
                  ? "bg-brand-500 text-white shadow-glow-brand"
                  : "border border-white/10 text-fg-muted hover:bg-white/5"
              }`}
            >
              Todos
            </Link>
            {categorias.map((cat) => {
              const cfg = CATEGORIA_CONFIG[cat] ?? CATEGORIA_CONFIG.geral;
              return (
                <Link
                  key={cat}
                  href={`/loja?categoria=${cat}`}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    categoria === cat
                      ? "bg-brand-500 text-white border-brand-500 shadow-glow-brand"
                      : `${cfg.color} hover:opacity-80`
                  }`}
                >
                  <span>{cfg.icon}</span>
                  {cfg.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Sem produtos */}
        {!products?.length && (
          <div className="py-24 text-center">
            <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-fg-subtle" />
            <p className="text-fg-muted">Nenhum produto disponível nesta categoria.</p>
            <Link
              href="/loja"
              className="mt-4 inline-block text-sm text-brand-400 hover:underline"
            >
              Ver todos os produtos →
            </Link>
          </div>
        )}

        {/* Destaques */}
        {featured.length > 0 && !categoria && (
          <section className="mb-10">
            <h2 className="mb-4 font-display text-xl font-bold text-fg">
              ⭐ Mais Recomendados
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} fmt={fmt} featured />
              ))}
            </div>
          </section>
        )}

        {/* Outros produtos */}
        {regular.length > 0 && (
          <section>
            {!categoria && featured.length > 0 && (
              <h2 className="mb-4 font-display text-xl font-bold text-fg">
                Todos os produtos
              </h2>
            )}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(categoria ? products ?? [] : regular).map((product) => (
                <ProductCard key={product.id} product={product} fmt={fmt} />
              ))}
            </div>
          </section>
        )}

        {/* Clube SOS */}
        <div className="mt-16">
          <ClubSOSBanner />
        </div>

        {/* Plaquinha CTA */}
        <div className="mt-8 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-6 text-center">
          <p className="font-display text-lg font-bold text-fg">
            🐾 Quer uma plaquinha personalizada?
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            Plaquinha com QR Code + nome e telefone gravados. Seu pet seguro em
            qualquer situação.
          </p>
          <Link
            href="/plaquinha"
            className="mt-4 inline-block rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-400"
          >
            Pedir minha plaquinha
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── ProductCard ────────────────────────────────────────────────
function ProductCard({
  product,
  fmt,
  featured = false,
}: {
  product: StoreProductRow;
  fmt: (cents: number) => string;
  featured?: boolean;
}) {
  const discount =
    product.original_price_cents && product.original_price_cents > product.price_cents
      ? Math.round(
          ((product.original_price_cents - product.price_cents) /
            product.original_price_cents) *
            100
        )
      : null;

  const cfg = CATEGORIA_CONFIG[product.category ?? 'geral'] ?? CATEGORIA_CONFIG.geral;

  return (
    <Link
      href={`/loja/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-warm-200 bg-white shadow-warm-card transition hover:border-brand-500/40 hover:shadow-warm-hover"
    >
      {/* Imagem */}
      <div className="relative aspect-square overflow-hidden bg-warm-100">
        {product.photo_url ? (
          <ProductImage src={product.photo_url} alt={product.name} fallbackIcon={cfg.icon} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            {cfg.icon}
          </div>
        )}
        {featured && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-yellow-500/90 px-2 py-0.5 text-[10px] font-bold text-black backdrop-blur-sm">
            <Star className="h-2.5 w-2.5" />
            Destaque
          </div>
        )}
        {discount && (
          <div className="absolute right-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">
            -{discount}%
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-[10px] uppercase tracking-wider text-fg-subtle">
          {product.supplier_name ?? "SOS Pet"}
        </p>
        <p className="line-clamp-2 text-sm font-medium leading-snug text-fg">
          {product.name}
        </p>

        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-brand-400">
              {fmt(product.price_cents)}
            </span>
            {product.original_price_cents && (
              <span className="text-xs text-fg-subtle line-through">
                {fmt(product.original_price_cents)}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-fg-subtle">
            {product.checkout_type === "external" ? (
              <>
                <ExternalLink className="h-3 w-3" />
                <span>Comprar no parceiro</span>
              </>
            ) : (
              <>
                <Tag className="h-3 w-3" />
                <span>Comprar aqui</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
