"use client";

import { useRef, useState, useTransition } from "react";
import { iniciarCheckoutPlaquinha } from "./actions";
import {
  Camera,
  CreditCard,
  MapPin,
  PawPrint,
  Phone,
  User,
  Loader2,
  ChevronRight,
} from "lucide-react";

type Step = 1 | 2 | 3;

/**
 * CheckoutForm — formulário multi-step para compra da plaquinha.
 *
 * Step 1: Dados do pet (nome, espécie, telefone da plaquinha, foto)
 * Step 2: Dados do comprador (nome, email)
 * Step 3: Endereço de entrega (CEP, rua, número, etc.)
 *
 * Ao submeter o Step 3, chama a Server Action que cria o pet,
 * o pedido e redireciona para o checkout do Mercado Pago.
 */
export function CheckoutForm() {
  const [step, setStep] = useState<Step>(1);
  const [preview, setPreview] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // ── Busca automática de CEP via ViaCEP ──────────────────
  async function handleCep(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const form = formRef.current;
        if (!form) return;
        (form.elements.namedItem("logradouro") as HTMLInputElement).value = data.logradouro ?? "";
        (form.elements.namedItem("bairro") as HTMLInputElement).value = data.bairro ?? "";
        (form.elements.namedItem("cidade") as HTMLInputElement).value = data.localidade ?? "";
        (form.elements.namedItem("estado") as HTMLInputElement).value = data.uf ?? "";
      }
    } catch {
      // silencioso
    } finally {
      setCepLoading(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    startTransition(() => iniciarCheckoutPlaquinha(data));
  }

  const STEPS = [
    { n: 1, label: "Seu pet" },
    { n: 2, label: "Seus dados" },
    { n: 3, label: "Entrega" },
  ];

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => step > s.n && setStep(s.n as Step)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step === s.n
                  ? "bg-brand-500 text-white shadow-glow-brand"
                  : step > s.n
                  ? "bg-brand-500/20 text-brand-400 cursor-pointer hover:bg-brand-500/30"
                  : "bg-ink-700 text-fg-subtle"
              }`}
            >
              {s.n}
            </button>
            <span
              className={`text-xs font-medium ${
                step >= s.n ? "text-fg" : "text-fg-subtle"
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 text-fg-subtle" />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Dados do pet ── */}
      {step === 1 && (
        <div className="space-y-5">
          <h3 className="font-display text-lg font-bold text-fg">
            Dados do seu pet
          </h3>

          {/* Foto */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
              Foto do pet (aparece no perfil digital)
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 bg-ink-700/40 p-6 transition-colors hover:border-brand-500/50 hover:bg-ink-700/60">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Preview"
                  className="h-28 w-28 rounded-full object-cover ring-2 ring-brand-500"
                />
              ) : (
                <>
                  <Camera className="h-8 w-8 text-fg-subtle" />
                  <span className="text-xs text-fg-muted">
                    Clique para adicionar foto
                  </span>
                </>
              )}
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoChange}
              />
            </label>
          </div>

          {/* Nome */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
              Nome do pet
            </label>
            <div className="relative">
              <PawPrint className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                type="text"
                name="pet_name"
                placeholder="Ex: Bolinha"
                className="w-full rounded-xl border border-white/10 bg-ink-700/60 py-3 pl-10 pr-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Espécie */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
              Espécie
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "dog", label: "🐶 Cão" },
                { value: "cat", label: "🐱 Gato" },
                { value: "other", label: "🐾 Outro" },
              ].map((opt) => (
                <label key={opt.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="species"
                    value={opt.value}
                    defaultChecked={opt.value === "dog"}
                    className="peer sr-only"
                  />
                  <div className="flex items-center justify-center rounded-xl border border-white/10 bg-ink-700/40 py-3 text-sm font-medium text-fg-muted transition-all peer-checked:border-brand-500/60 peer-checked:bg-brand-500/10 peer-checked:text-brand-300">
                    {opt.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Telefone da plaquinha */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
              Telefone gravado na plaquinha *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                type="tel"
                name="tag_phone"
                required
                placeholder="(13) 99999-9999"
                className="w-full rounded-xl border border-white/10 bg-ink-700/60 py-3 pl-10 pr-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-fg-subtle">
              Este número ficará visível na plaquinha física para contato.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400 active:scale-95"
          >
            Próximo →
          </button>
        </div>
      )}

      {/* ── Step 2: Dados do comprador ── */}
      {step === 2 && (
        <div className="space-y-5">
          <h3 className="font-display text-lg font-bold text-fg">
            Seus dados
          </h3>
          <p className="text-xs text-fg-muted">
            Usados para emissão do recibo e acompanhamento do pedido.
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
              Nome completo *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                type="text"
                name="owner_name"
                required
                placeholder="Seu nome completo"
                className="w-full rounded-xl border border-white/10 bg-ink-700/60 py-3 pl-10 pr-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
              E-mail *
            </label>
            <input
              type="email"
              name="owner_email"
              required
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-white/10 bg-ink-700/60 py-3 px-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-fg-subtle">
              Você receberá a confirmação e o rastreio por aqui.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-white/10 py-3.5 text-sm font-medium text-fg-muted transition-colors hover:bg-white/5"
            >
              ← Voltar
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-[2] rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400 active:scale-95"
            >
              Próximo →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Endereço de entrega ── */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-fg">
            Endereço de entrega
          </h3>

          {/* CEP */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
              CEP *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                type="text"
                name="cep"
                required
                maxLength={9}
                placeholder="00000-000"
                className="w-full rounded-xl border border-white/10 bg-ink-700/60 py-3 pl-10 pr-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none"
                onChange={(e) => handleCep(e.target.value)}
              />
              {cepLoading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-fg-subtle" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
                Logradouro *
              </label>
              <input
                type="text"
                name="logradouro"
                required
                placeholder="Rua, Av, etc."
                className="w-full rounded-xl border border-white/10 bg-ink-700/60 py-3 px-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <div className="w-24">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
                Nº *
              </label>
              <input
                type="text"
                name="numero"
                required
                placeholder="123"
                className="w-full rounded-xl border border-white/10 bg-ink-700/60 py-3 px-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
              Complemento
            </label>
            <input
              type="text"
              name="complemento"
              placeholder="Apto, bloco, casa..."
              className="w-full rounded-xl border border-white/10 bg-ink-700/60 py-3 px-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
                Bairro *
              </label>
              <input
                type="text"
                name="bairro"
                required
                className="w-full rounded-xl border border-white/10 bg-ink-700/60 py-3 px-4 text-sm text-fg focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
                Cidade *
              </label>
              <input
                type="text"
                name="cidade"
                required
                className="w-full rounded-xl border border-white/10 bg-ink-700/60 py-3 px-4 text-sm text-fg focus:border-brand-500/60 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-fg-muted">
              Estado *
            </label>
            <input
              type="text"
              name="estado"
              required
              maxLength={2}
              placeholder="SP"
              className="w-full rounded-xl border border-white/10 bg-ink-700/60 py-3 px-4 text-sm text-fg uppercase focus:border-brand-500/60 focus:outline-none"
            />
          </div>

          {/* Resumo do pedido */}
          <div className="rounded-xl border border-white/10 bg-ink-700/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-fg">
                <CreditCard className="h-4 w-4 text-brand-400" />
                Plaquinha SOS Pet (1x)
              </div>
              <span className="font-display text-lg font-black text-brand-400">
                R${" "}
                {(Number(process.env.NEXT_PUBLIC_TAG_PRICE_BRL ?? "39.90")).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-fg-subtle">
              Aceita PIX, cartão de crédito (até 6x) e boleto · Frete incluso
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={isPending}
              className="flex-1 rounded-xl border border-white/10 py-3.5 text-sm font-medium text-fg-muted transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              ← Voltar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400 active:scale-95 disabled:opacity-70"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Ir para o pagamento
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
