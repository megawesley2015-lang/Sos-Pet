"use client";

import { useRef, useState, useTransition } from "react";
import { criarProdutoAction } from "./actions";
import { ImagePlus, Loader2, X } from "lucide-react";

const CATEGORIAS = [
  { value: "plaquinha", label: "Plaquinha / Identificação" },
  { value: "coleira", label: "Coleiras / Guias" },
  { value: "acessorio", label: "Acessórios" },
  { value: "roupa", label: "Roupas / Fantasia" },
  { value: "higiene", label: "Higiene / Banho" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "geral", label: "Geral" },
];

const FORNECEDORES = [
  "Pet Print",
  "My Family Brasil",
  "Pinnpet",
  "Palecon Presentes",
  "Printful",
  "Zocprint",
  "Plaquinha.com",
  "Outro",
];

export default function NovoProdutoForm({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [checkoutType, setCheckoutType] = useState("external");
  const formRef = useRef<HTMLFormElement>(null);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      await criarProdutoAction(data);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-ink-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-fg">Novo Produto</h2>
          <button onClick={onClose} className="text-fg-subtle hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Foto */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-subtle">Foto do produto</label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-ink-700/40 p-4 transition hover:border-brand-500/50">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="h-32 w-32 rounded-lg object-cover" />
              ) : (
                <>
                  <ImagePlus className="mb-2 h-8 w-8 text-fg-subtle" />
                  <span className="text-xs text-fg-subtle">Clique para selecionar</span>
                </>
              )}
              <input type="file" name="photo" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
          </div>

          {/* Nome */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-subtle">Nome do produto *</label>
            <input
              name="name"
              required
              placeholder="ex: Plaquinha PetID Redonda Personalizada"
              className="w-full rounded-xl border border-white/10 bg-ink-700 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-subtle">Descrição</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Descreva o produto brevemente..."
              className="w-full rounded-xl border border-white/10 bg-ink-700 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand-500 focus:outline-none resize-none"
            />
          </div>

          {/* Preços */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-subtle">Preço (R$) *</label>
              <input
                name="price_brl"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="39.90"
                className="w-full rounded-xl border border-white/10 bg-ink-700 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-subtle">Preço original (R$)</label>
              <input
                name="original_price_brl"
                type="number"
                step="0.01"
                min="0"
                placeholder="59.90 (opcional)"
                className="w-full rounded-xl border border-white/10 bg-ink-700 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Fornecedor + Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-subtle">Fornecedor</label>
              <select
                name="supplier_name"
                className="w-full rounded-xl border border-white/10 bg-ink-700 px-3 py-2.5 text-sm text-fg focus:border-brand-500 focus:outline-none"
              >
                <option value="">Selecione...</option>
                {FORNECEDORES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-subtle">Categoria</label>
              <select
                name="category"
                className="w-full rounded-xl border border-white/10 bg-ink-700 px-3 py-2.5 text-sm text-fg focus:border-brand-500 focus:outline-none"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo de checkout */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-subtle">Tipo de compra</label>
            <div className="flex gap-3">
              {[
                { value: "external", label: "Link externo", desc: "Redireciona ao site do fornecedor" },
                { value: "internal", label: "Checkout interno", desc: "Pagamento via Mercado Pago no SOS Pet" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-1 cursor-pointer flex-col rounded-xl border p-3 transition ${
                    checkoutType === opt.value
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-white/10 bg-ink-700/40 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="checkout_type"
                    value={opt.value}
                    checked={checkoutType === opt.value}
                    onChange={() => setCheckoutType(opt.value)}
                    className="hidden"
                  />
                  <span className="text-xs font-semibold text-fg">{opt.label}</span>
                  <span className="mt-0.5 text-[10px] text-fg-subtle">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* URL externa (só se external) */}
          {checkoutType === "external" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-subtle">URL do produto no fornecedor</label>
              <input
                name="external_url"
                type="url"
                placeholder="https://petprint.com.br/produto/..."
                className="w-full rounded-xl border border-white/10 bg-ink-700 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand-500 focus:outline-none"
              />
            </div>
          )}

          {/* Destaque */}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-ink-700/40 p-3">
            <input type="hidden" name="featured" value="false" />
            <input
              type="checkbox"
              name="featured"
              value="true"
              className="h-4 w-4 rounded accent-brand-500"
            />
            <div>
              <p className="text-sm font-medium text-fg">Produto em destaque</p>
              <p className="text-xs text-fg-subtle">Aparece primeiro na vitrine com badge especial</p>
            </div>
          </label>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-fg-subtle hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-400 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar produto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
