"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Syringe } from "lucide-react";
import { addVaccination } from "./actions";
import type { VaccineState } from "./actions";

const initialState: VaccineState = {};

export function AddVaccineForm({ petId }: { petId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = addVaccination.bind(null, petId);
  const [state, action, isPending] = useActionState(boundAction, initialState);

  if (state.success && open) setOpen(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-500/30 py-3 text-sm font-bold text-cyan-300 transition hover:border-cyan-500/60 hover:bg-cyan-500/5"
      >
        <Syringe className="h-4 w-4" />
        Registrar vacina
      </button>
    );
  }

  return (
    <form action={action} className="rounded-xl border border-cyan-500/30 bg-ink-700/50 p-5">
      <h3 className="mb-4 text-sm font-semibold text-fg">Registrar vacina</h3>

      {state.error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Vacina <span className="text-danger">*</span>
          </label>
          <input
            name="vaccine_name"
            required
            placeholder="Ex.: V10, Antirrábica, Gripe"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
          />
          {state.fieldErrors?.vaccine_name && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.vaccine_name[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Data de aplicação <span className="text-danger">*</span>
          </label>
          <input
            name="applied_date"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Próxima dose
          </label>
          <input
            name="next_dose_date"
            type="date"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Veterinário
          </label>
          <input
            name="vet_name"
            placeholder="Nome do veterinário"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Lote
          </label>
          <input
            name="batch"
            placeholder="Número do lote"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Observações
          </label>
          <input
            name="notes"
            placeholder="Reações, recomendações…"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-400 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Salvar vacina
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-fg-muted hover:text-fg">
          Cancelar
        </button>
      </div>
    </form>
  );
}
