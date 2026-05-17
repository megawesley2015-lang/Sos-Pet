"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createShelterPet } from "./actions";
import type { ShelterPetFormState } from "./actions";

const initialState: ShelterPetFormState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-danger">{errors[0]}</p>;
}

export default function NovoPetOngPage() {
  const [state, action, isPending] = useActionState(createShelterPet, initialState);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/ong/pets" className="rounded-lg p-2 text-fg-muted hover:bg-ink-700 hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Cadastrar pet</h1>
          <p className="mt-0.5 text-sm text-fg-muted">Registre um animal resgatado</p>
        </div>
      </div>

      {state.error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-6">
        {/* Identificação */}
        <section className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Identificação</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Nome <span className="text-fg-subtle">(opcional)</span>
              </label>
              <input
                name="name"
                placeholder="Ex.: Bolinha"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Espécie <span className="text-danger">*</span>
              </label>
              <select
                name="species"
                required
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
              >
                <option value="dog">🐶 Cão</option>
                <option value="cat">🐱 Gato</option>
                <option value="other">🐾 Outro</option>
              </select>
              <FieldError errors={state.fieldErrors?.species} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Raça <span className="text-fg-subtle">(opcional)</span>
              </label>
              <input
                name="breed"
                placeholder="Ex.: Vira-lata, SRD"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Cor predominante <span className="text-danger">*</span>
              </label>
              <input
                name="color"
                required
                placeholder="Ex.: Caramelo, Preto e branco"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
              <FieldError errors={state.fieldErrors?.color} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Porte <span className="text-danger">*</span>
              </label>
              <select
                name="size"
                required
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
              >
                <option value="small">Pequeno (até 10kg)</option>
                <option value="medium">Médio (10–25kg)</option>
                <option value="large">Grande (acima de 25kg)</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Sexo <span className="text-danger">*</span>
              </label>
              <select
                name="sex"
                required
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
              >
                <option value="unknown">Não identificado</option>
                <option value="male">Macho</option>
                <option value="female">Fêmea</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Idade estimada
              </label>
              <input
                name="estimated_age"
                placeholder="Ex.: 6 meses, 2 anos"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Resgate */}
        <section className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Resgate</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Data do resgate <span className="text-danger">*</span>
              </label>
              <input
                name="rescue_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
              />
              <FieldError errors={state.fieldErrors?.rescue_date} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Local do resgate
              </label>
              <input
                name="rescue_location"
                placeholder="Ex.: Rua das Flores, Centro"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Prontuário — dados fixos */}
        <section className="rounded-xl border border-cyan-500/20 bg-ink-700/50 p-5">
          <h2 className="mb-1 text-sm font-semibold text-fg">Prontuário</h2>
          <p className="mb-4 text-xs text-fg-muted">Dados permanentes do pet</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Peso (kg)
              </label>
              <input
                name="weight_kg"
                type="number"
                step="0.1"
                min="0"
                max="200"
                placeholder="Ex.: 4.5"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
              <FieldError errors={state.fieldErrors?.weight_kg} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Microchip
              </label>
              <input
                name="microchip"
                maxLength={50}
                placeholder="Número do microchip"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="is_castrated"
                name="is_castrated"
                type="checkbox"
                className="h-4 w-4 rounded accent-cyan-500"
              />
              <label htmlFor="is_castrated" className="text-sm font-medium text-fg">
                Animal castrado
              </label>
            </div>
          </div>
        </section>

        {/* Saúde */}
        <section className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Saúde</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Estado de saúde <span className="text-danger">*</span>
              </label>
              <select
                name="health_status"
                required
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
              >
                <option value="healthy">Saudável</option>
                <option value="recovering">Em recuperação</option>
                <option value="critical">Estado crítico</option>
                <option value="treated">Tratado</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Comportamento
              </label>
              <input
                name="behavior"
                placeholder="Ex.: Dócil, arisco com crianças"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Descrição geral
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Observações importantes sobre o pet…"
                className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Foto */}
        <section className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
          <h2 className="mb-1 text-sm font-semibold text-fg">Foto</h2>
          <p className="mb-4 text-xs text-fg-muted">
            Insira a URL de uma foto já hospedada (Supabase Storage, etc.)
          </p>
          <input
            name="photo_url"
            type="url"
            placeholder="https://…"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
          />
          <FieldError errors={state.fieldErrors?.photo_url} />
        </section>

        {/* Submit */}
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
            "Cadastrar pet"
          )}
        </button>
      </form>
    </div>
  );
}
