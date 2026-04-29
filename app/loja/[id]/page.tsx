import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShoppingCart, Tag, Shield } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = createServiceClient();
  const { data } = await service.from("store_products").select("name, description").eq("id", id).single();
  if (!data) return { title: "Produto não encontrado · SOS Pet" };
  return {
    title: `${data.name} · Loja SOS Pet`,
    description: data.description ?? undefined,
  };
}

export default async function ProdutoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = createServiceClient();

  const { data: product } = await service
    .from("store_products")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .single();

  if (!product) notFound();

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const discount =
    product.original_price_cents && product.original_price_cents > product.price_cents
      ? Math.round(
          ((product.original_price_cents - product.price_cents) / product.original_price_cents) * 100
        )
      : null;

  return (
    <div className="min-h-screen bg-ink-900 text-fg">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <Link href="/loja" className="mb-6 flex items-center gap-1.5 text-sm text-fg-subtle hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
          Voltar para a loja
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Imagem */}
          <div className="aspect-square overflow-hidden rounded-2xl bg-ink-700">
            {product.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.photo_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl">🛍️</div>
            )}
          </div>

          {/* Detalhes */}
          <div className="flex flex-col">
            {product.supplier_name && (
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-fg-subtle">
                {product.supplier_name}
              </p>
            )}
            <h1 className="font-display text-2xl font-black text-fg">{product.name}</h1>

            {product.description && (
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{product.description}</p>
            )}

            {/* Preço */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-3xl font-black text-brand-400">
                {fmt(product.price_cents)}
              </span>
              {product.original_price_cents && (
                <span className="text-lg text-fg-subtle line-through">
                  {fmt(product.original_price_cents)}
                </span>
              )}
              {discount && (
                <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">
                  -{discount}%
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="mt-6">
              {product.checkout_type === "external" && product.external_url ? (
                <a
                  href={product.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-base font-bold text-white hover:bg-brand-400"
                >
                  <ExternalLink className="h-5 w-5" />
                  Comprar no site do fornecedor
                </a>
              ) : product.checkout_type === "internal" ? (
                <Link
                  href="/plaquinha"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-base font-bold text-white hover:bg-brand-400"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Comprar agora
                </Link>
              ) : (
                <div className="rounded-xl border border-white/10 py-3.5 text-center text-sm text-fg-subtle">
                  Entre em contato para adquirir este produto
                </div>
              )}
            </div>

            {/* Garantias */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-xs text-fg-subtle">
                <Shield className="h-3.5 w-3.5 text-green-400" />
                <span>Produto selecionado pela equipe SOS Pet</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-fg-subtle">
                <Tag className="h-3.5 w-3.5 text-cyan-400" />
                <span>Preço verificado em {new Date().toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plaquinha CTA */}
        <div className="mt-12 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-6 text-center">
          <p className="font-display text-lg font-bold text-fg">🐾 Não esqueça da plaquinha!</p>
          <p className="mt-1 text-sm text-fg-muted">
            Com o QR Code do SOS Pet, qualquer pessoa que encontrar seu pet pode ver seu contato na hora.
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
