import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ShoppingBag, Star, ExternalLink, Tag } from "lucide-react";

export const metadata = {
  title: "Loja · SOS Pet",
  description: "Produtos selecionados para o bem-estar do seu pet. Plaquinhas, coleiras, acessórios e muito mais.",
};

const CATEGORIA_LABELS: Record<string, string> = {
  plaquinha: "Plaquinhas",
  coleira: "Coleiras",
  acessorio: "Acessórios",
  roupa: "Roupas",
  higiene: "Higiene",
  alimentacao: "Alimentação",
  geral: "Geral",
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
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (categoria) {
    query = query.eq("category", categoria);
  }

  const { data: products } = await query;

  // Categorias disponíveis
  const { data: allProducts } = await service
    .from("store_products")
    .select("category")
    .eq("active", true);

  const categorias = [...new Set(allProducts?.map((p) => p.category) ?? [])];

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-ink-900 text-fg">
      {/* Hero */}
      <div className="border-b border-white/10 bg-gradient-to-b from-ink-800 to-ink-900 px-4 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/20 mb-4">
          <ShoppingBag className="h-7 w-7 text-brand-400" />
        </div>
        <h1 className="font-display text-3xl font-black text-fg">Loja SOS Pet</h1>
        <p className="mt-2 text-fg-muted max-w-md mx-auto text-sm">
          Produtos selecionados de fornecedores parceiros para o bem-estar e segurança do seu pet.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Filtro por categoria */}
        {categorias.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Link
              href="/loja"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                !categoria
                  ? "bg-brand-500 text-white"
                  : "border border-white/10 text-fg-muted hover:bg-white/5"
              }`}
            >
              Todos
            </Link>
            {categorias.map((cat) => (
              <Link
                key={cat}
                href={`/loja?categoria=${cat}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  categoria === cat
                    ? "bg-brand-500 text-white"
                    : "border border-white/10 text-fg-muted hover:bg-white/5"
                }`}
              >
                {CATEGORIA_LABELS[cat] ?? cat}
              </Link>
            ))}
          </div>
        )}

        {/* Sem produtos */}
        {!products?.length && (
          <div className="py-20 text-center">
            <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-fg-subtle" />
            <p className="text-fg-muted">Nenhum produto disponível no momento.</p>
            <p className="mt-1 text-sm text-fg-subtle">Volte em breve — estamos selecionando os melhores produtos!</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products?.map((product) => {
            const discount =
              product.original_price_cents && product.original_price_cents > product.price_cents
                ? Math.round(
                    ((product.original_price_cents - product.price_cents) /
                      product.original_price_cents) *
                      100
                  )
                : null;

            return (
              <Link
                key={product.id}
                href={`/loja/${product.id}`}
                className="group flex flex-col rounded-2xl border border-white/10 bg-ink-700/40 overflow-hidden transition hover:border-brand-500/40 hover:bg-ink-700/60"
              >
                {/* Imagem */}
                <div className="relative aspect-square bg-ink-600 overflow-hidden">
                  {product.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.photo_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl">🛍️</div>
                  )}
                  {product.featured && (
                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-yellow-500/90 px-2 py-0.5 text-[10px] font-bold text-black backdrop-blur-sm">
                      <Star className="h-2.5 w-2.5" /> Destaque
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
                  <p className="text-[11px] text-fg-subtle mb-1">{product.supplier_name ?? "SOS Pet"}</p>
                  <p className="font-medium text-fg leading-snug line-clamp-2 text-sm">{product.name}</p>

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
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-fg-subtle">
                      {product.checkout_type === "external" ? (
                        <>
                          <ExternalLink className="h-3 w-3" />
                          <span>Comprar no fornecedor</span>
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
          })}
        </div>

        {/* Plaquinha CTA */}
        <div className="mt-12 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-6 text-center">
          <p className="font-display text-lg font-bold text-fg">🐾 Quer uma plaquinha personalizada?</p>
          <p className="mt-1 text-sm text-fg-muted">
            Plaquinha com QR Code + nome e telefone gravados. Seu pet seguro em qualquer situação.
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
