"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createAdoption } from "../actions";
import type { AdoptionFormState } from "../actions";

const initialState: AdoptionFormState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-danger">{errors[0]}</p>;
}

export default function NovaAdocaoPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const [state, action, isPending] = useActionState(createAdoption, initialState);
  const [defaultPetId, setDefaultPetId] = useState<string>("");
  const [pets, setPets] = useState<{ id: string; name: string | null; species: string }[]>([]);

  useEffect(() => {
    searchParams.then((p) => {
      if (p.pet) setDefaultPetId(p.pet);
    });

    // Carrega pets disponíveis
    fetch("/api/ong/available-pets")
      .then((r) => r.json())
      .then((data) => setPets(data.pets ?? []))
      .catch(() => {});
  }, [searchParams]);

  const SPECIES_EMOJI: Record<string, string> = { dog: "🐶", cat: "🐱", other: "🐾" };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ong/adocoes" className="rounded-lg p-2 text-fg-muted hover:bg-ink-700 hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Registrar adoção</h1>
          <p className="mt-0.5 text-sm text-fg-muted">Registre os dados do adotante e o pet adotado</p>
        </div>
      </div>

      {state.error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-5">
        {/* Pet */}
        <section className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Pet adotado</h2>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">
              Selecione o pet <span className="text-danger">*</span>
            </label>
            <select
              name="pet_id"
              required
              defaultValue={defaultPetId}
              className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
            >
              <option value="">-- Selecione --</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {SPECIES_EMOJI[pet.species]} {pet.name ?? "Sem nome"} ({pet.id.slice(0, 6)}…)
                </option>
              ))}
            </select>
            <FieldError errors={state.fieldErrors?.pet_id} />
          </div>
        </section>

        {/* Adotante */}
        <section className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Dados do adotante</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Nome completo <span className="text-danger">*</span>
              </label>
              <input
                name="adopter_name"
                required
                placeholder="Nome do adotante"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
              <FieldError errors={state.fieldErrors?.adopter_name} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Telefone / WhatsApp <span className="text-danger">*</span>
              </label>
              <input
                name="adopter_phone"
                required
                type="tel"
                placeholder="(13) 99999-9999"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
              <FieldError errors={state.fieldErrors?.adopter_phone} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                E-mail
              </label>
              <input
                name="adopter_email"
                type="email"
                placeholder="email@exemplo.com"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
              <FieldError errors={state.fieldErrors?.adopter_email} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Cidade <span className="text-danger">*</span>
              </label>
              <input
                name="adopter_city"
                required
                placeholder="Cidade do adotante"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
              <FieldError errors={state.fieldErrors?.adopter_city} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Bairro
              </label>
              <input
                name="adopter_neighborhood"
                placeholder="Bairro do adotante"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Adoção */}
        <section className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Dados da adoção</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Data da adoção <span className="text-danger">*</span>
              </label>
              <input
                name="adoption_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
              />
              <FieldError errors={state.fieldErrors?.adoption_date} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Status
              </label>
              <select
                name="status"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
              >
                <option value="active">Ativo — adoção em andamento</option>
                <option value="returned">Devolvido</option>
                <option value="deceased">Falecido</option>
                <option value="transferred">Transferido</option>
              </select>
            </div>
          </div>
        </section>

        {/* Acompanhamento pós-adoção */}
        <section className="rounded-xl border border-cyan-500/20 bg-ink-700/50 p-5">
          <h2 className="mb-1 text-sm font-semibold text-fg">Acompanhamento pós-adoção</h2>
          <p className="mb-4 text-xs text-fg-muted">
            Defina as datas de retorno em 30 e 90 dias para monitorar o bem-estar do pet.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Data — 30 dias
              </label>
              <input
                name="follow_up_30_date"
                type="date"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Observações — 30 dias
              </label>
              <input
                name="follow_up_30_notes"
                maxLength={500}
                placeholder="Ex.: Ligação agendada"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Data — 90 dias
              </label>
              <input
                name="follow_up_90_date"
                type="date"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Observações — 90 dias
              </label>
              <input
                name="follow_up_90_notes"
                maxLength={500}
                placeholder="Ex.: Visita domiciliar"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-glow-brand transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
            </>
          ) : (
            "Registrar adoção"
          )}
        </button>
      </form>
    </div>
  );
}
