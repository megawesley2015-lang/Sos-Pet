"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitParceriaAction, type ParceiroState } from "./actions";

const initial: ParceiroState = {};

export function ParceriaForm() {
  const [state, formAction] = useActionState(submitParceriaAction, initial);

  if (state.ok && state.successName) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink-900">
          Mensagem enviada, {state.successName.split(" ")[0]}!
        </h2>
        <p className="mt-2 text-sm text-ink-700">
          Obrigado pelo interesse. Nossa equipe vai analisar e responder no
          e-mail informado em até 5 dias úteis.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.message && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">
          {state.message}
        </div>
      )}

      <Field
        name="nome"
        label="Seu nome"
        required
        error={state.errors?.nome}
        autoComplete="name"
      />

      <Field
        name="email"
        label="E-mail"
        type="email"
        required
        error={state.errors?.email}
        autoComplete="email"
      />

      <Field
        name="empresa"
        label="Empresa / organização (opcional)"
        error={state.errors?.empresa}
        autoComplete="organization"
      />

      <div>
        <label
          htmlFor="mensagem"
          className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-brand-700/80"
        >
          Como podemos colaborar?
        </label>
        <textarea
          id="mensagem"
          name="mensagem"
          rows={5}
          maxLength={1000}
          placeholder="Conte sobre sua organização e o que tem em mente"
          aria-invalid={!!state.errors?.mensagem}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
            state.errors?.mensagem
              ? "border-red-400 focus:border-red-500"
              : "border-warm-300 focus:border-brand-500/60"
          }`}
        />
        {state.errors?.mensagem && (
          <p className="mt-1 text-xs text-red-700">{state.errors.mensagem}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400 active:scale-[0.98]"
      >
        Enviar mensagem
      </button>

      <p className="text-center text-[11px] text-ink-700">
        Ao enviar, você concorda com nossa{" "}
        <a href="/privacidade" className="underline hover:text-brand-600">
          Política de Privacidade
        </a>
        .
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  error,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-brand-700/80"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-warm-300 focus:border-brand-500/60"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
