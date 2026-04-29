"use client";

import { useState } from "react";
import { Plus, Eye, EyeOff, Trash2, ExternalLink, Star } from "lucide-react";
import { toggleProdutoAction, deletarProdutoAction } from "./actions";
import NovoProdutoForm from "./NovoProdutoForm";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  original_price_cents: number | null;
  photo_url: string | null;
  supplier_name: string | null;
  category: string;
  checkout_type: string;
  external_url: string | null;
  active: boolean;
  featured: boolean;
  created_at: string;
};

export default function LojaAdminClient({ products }: { products: Product[] }) {
  const [showForm, setShowForm] = useState(false);

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-ink-900 p-6 text-fg">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <a href="/admin" className="mb-1 block text-xs text-fg-subtle hover:text-fg">← Admin</a>
            <h1 className="font-display text-2xl font-black text-fg">Loja</h1>
            <p className="text-sm text-fg-muted">{products.length} produto{products.length !== 1 ? "s" : ""} cadastrado{products.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/loja"
              target="_blank"
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-fg-muted hover:bg-white/5"
            >
              <ExternalLink className="h-4 w-4" />
              Ver vitrine
            </a>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-400"
            >
              <Plus className="h-4 w-4" />
              Novo produto
            </button>
          </div>
        </div>

        {/* Lista */}
        {products.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-ink-700/40 p-16 text-center">
            <p className="text-fg-muted">Nenhum produto cadastrado ainda.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-400"
            >
              Adicionar primeiro produto
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl border bg-ink-700/40 p-4 transition ${
                  p.active ? "border-white/10" : "border-white/5 opacity-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Foto */}
                  {p.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photo_url}
                      alt={p.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-xl object-cover bg-ink-600"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-ink-600 flex items-center justify-center text-2xl">
                      🛍️
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-fg">{p.name}</span>
                      {p.featured && (
                        <span className="flex items-center gap-0.5 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
                          <Star className="h-2.5 w-2.5" /> Destaque
                        </span>
                      )}
                      {!p.active && (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-fg-subtle">
                          Inativo
                        </span>
                      )}
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-fg-subtle capitalize">
                        {p.category}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-fg-muted">
                      {p.supplier_name && <span>🏭 {p.supplier_name}</span>}
                      <span className="font-semibold text-brand-400">{fmt(p.price_cents)}</span>
                      {p.original_price_cents && (
                        <span className="line-through text-fg-subtle">{fmt(p.original_price_cents)}</span>
                      )}
                      <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px]">
                        {p.checkout_type === "external" ? "Link externo" : "Checkout interno"}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    {p.external_url && (
                      <a
                        href={p.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-white/10 p-2 text-fg-subtle hover:bg-white/5"
                        title="Ver no fornecedor"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <form action={toggleProdutoAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="active" value={String(p.active)} />
                      <button
                        type="submit"
                        className="rounded-lg border border-white/10 p-2 text-fg-subtle hover:bg-white/5"
                        title={p.active ? "Desativar" : "Ativar"}
                      >
                        {p.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </form>
                    <form
                      action={deletarProdutoAction}
                      onSubmit={(e) => {
                        if (!confirm(`Excluir "${p.name}"?`)) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-500/20 p-2 text-red-400/70 hover:bg-red-500/10"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <NovoProdutoForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
