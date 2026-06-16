"use client";

import { useState } from "react";
import { User, Phone, MapPin, ChevronRight } from "lucide-react";

const CIDADES_BAIXADA = [
  "Santos",
  "Guarujá",
  "São Vicente",
  "Cubatão",
  "Bertioga",
  "Praia Grande",
  "Mongaguá",
  "Itanhaém",
  "Peruíbe",
  "Outra",
];

type Props = {
  onSubmit: (data: { full_name: string; phone: string; cidade: string }) => Promise<void>;
  onSkip: () => void;
  isPending: boolean;
};

export function StepPerfil({ onSubmit, onSkip, isPending }: Props) {
  const [full_name, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cidade, setCidade] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};
    if (!full_name.trim()) next.full_name = "Nome é obrigatório.";
    if (!phone.trim()) next.phone = "Telefone é obrigatório.";
    if (!cidade) next.cidade = "Selecione sua cidade.";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit({ full_name, phone, cidade });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = isSubmitting || isPending;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        <div>
          <label
            htmlFor="full_name"
            className="mb-1.5 block text-sm font-semibold text-[rgb(var(--color-fg))]"
          >
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-[rgb(var(--color-primary))]" />
              Seu nome
            </span>
          </label>
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Ex: Maria Silva"
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            aria-describedby={errors.full_name ? "full_name-error" : undefined}
            className="w-full rounded-lg border border-[rgb(var(--color-fg-subtle)/0.3)] bg-[rgb(var(--color-bg-elevated,var(--color-bg)))] px-4 py-2.5 text-sm text-[rgb(var(--color-fg))] placeholder:text-[rgb(var(--color-fg-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary)/0.4)] disabled:opacity-50"
          />
          {errors.full_name && (
            <p id="full_name-error" role="alert" className="mt-1 text-xs text-red-400">
              {errors.full_name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block text-sm font-semibold text-[rgb(var(--color-fg))]"
          >
            <span className="flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-[rgb(var(--color-primary))]" />
              Telefone / WhatsApp
            </span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(13) 9 0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className="w-full rounded-lg border border-[rgb(var(--color-fg-subtle)/0.3)] bg-[rgb(var(--color-bg-elevated,var(--color-bg)))] px-4 py-2.5 text-sm text-[rgb(var(--color-fg))] placeholder:text-[rgb(var(--color-fg-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary)/0.4)] disabled:opacity-50"
          />
          {errors.phone && (
            <p id="phone-error" role="alert" className="mt-1 text-xs text-red-400">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="cidade"
            className="mb-1.5 block text-sm font-semibold text-[rgb(var(--color-fg))]"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[rgb(var(--color-primary))]" />
              Sua cidade
            </span>
          </label>
          <select
            id="cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            disabled={isLoading}
            aria-describedby={errors.cidade ? "cidade-error" : undefined}
            className="w-full rounded-lg border border-[rgb(var(--color-fg-subtle)/0.3)] bg-[rgb(var(--color-bg-elevated,var(--color-bg)))] px-4 py-2.5 text-sm text-[rgb(var(--color-fg))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary)/0.4)] disabled:opacity-50"
          >
            <option value="" disabled>
              Selecione sua cidade…
            </option>
            {CIDADES_BAIXADA.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.cidade && (
            <p id="cidade-error" role="alert" className="mt-1 text-xs text-red-400">
              {errors.cidade}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "Salvando…" : "Continuar"}
          {!isLoading && <ChevronRight className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onSkip}
          disabled={isLoading}
          className="w-full rounded-xl border border-[rgb(var(--color-fg-subtle)/0.3)] px-6 py-3 text-sm font-medium text-[rgb(var(--color-fg-muted))] transition-colors hover:text-[rgb(var(--color-fg))] disabled:opacity-50"
        >
          Pular por agora
        </button>
      </div>
    </form>
  );
}
