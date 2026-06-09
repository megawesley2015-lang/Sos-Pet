"use client";

import { useActionState } from "react";
import { Building2, Loader2, CheckCircle2 } from "lucide-react";
import { upsertShelter } from "./actions";
import type { ShelterState } from "./actions";

const initialState: ShelterState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-danger">{errors[0]}</p>;
}

export default function CadastroOngPage() {
  const [state, action, isPending] = useActionState(upsertShelter, initialState);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-cyan-400" />
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Minha ONG / Abrigo</h1>
          <p className="mt-0.5 text-sm text-fg-muted">
            Configure os dados da sua organização
          </p>
        </div>
      </div>

      {state.success && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="text-sm text-success">Dados salvos com sucesso!</p>
        </div>
      )}

      {state.error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-5">
        {/* Identificação */}
        <section className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Identificação</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Nome da ONG / Abrigo <span className="text-danger">*</span>
              </label>
              <input
                name="name"
                required
                placeholder="Ex.: Abrigo dos Patinhas"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
              <FieldError errors={state.fieldErrors?.name} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Tipo <span className="text-danger">*</span>
              </label>
              <select
                name="type"
                required
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
              >
                <option value="ong">ONG</option>
                <option value="protetor">Protetor independente</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                CNPJ <span className="text-fg-subtle">(se ONG formal)</span>
              </label>
              <input
                name="cnpj"
                placeholder="00.000.000/0000-00"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Contato */}
        <section className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Contato</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Telefone / WhatsApp <span className="text-danger">*</span>
              </label>
              <input
                name="phone"
                required
                type="tel"
                placeholder="(13) 99999-9999"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
              <FieldError errors={state.fieldErrors?.phone} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                E-mail
              </label>
              <input
                name="email"
                type="email"
                placeholder="contato@ong.com.br"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
              <FieldError errors={state.fieldErrors?.email} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Cidade <span className="text-danger">*</span>
              </label>
              <input
                name="city"
                required
                placeholder="Santos, SP"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
              <FieldError errors={state.fieldErrors?.city} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Bairro
              </label>
              <input
                name="neighborhood"
                placeholder="Ex.: Centro"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Sobre a organização
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Descreva brevemente o trabalho da ONG…"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
            </>
          ) : (
            "Salvar dados"
          )}
        </button>
      </form>
    </div>
  );
}
