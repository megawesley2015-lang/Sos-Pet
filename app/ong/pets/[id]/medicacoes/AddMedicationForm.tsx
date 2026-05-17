"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Pill } from "lucide-react";
import { addMedication } from "./actions";
import type { MedState } from "./actions";

const initialState: MedState = {};

export function AddMedicationForm({ petId }: { petId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = addMedication.bind(null, petId);
  const [state, action, isPending] = useActionState(boundAction, initialState);

  if (state.success && open) setOpen(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-500/30 py-3 text-sm font-bold text-brand-300 transition hover:border-brand-500/60 hover:bg-brand-500/5"
      >
        <Pill className="h-4 w-4" />
        Adicionar medicação
      </button>
    );
  }

  return (
    <form action={action} className="rounded-xl border border-brand-500/30 bg-ink-700/50 p-5">
      <h3 className="mb-4 text-sm font-semibold text-fg">Nova medicação</h3>

      {state.error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Medicamento <span className="text-danger">*</span>
          </label>
          <input
            name="medication_name"
            required
            placeholder="Ex.: Amoxicilina, Prednisolona"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand-500/60 focus:outline-none"
          />
          {state.fieldErrors?.medication_name && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.medication_name[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Dosagem <span className="text-danger">*</span>
          </label>
          <input
            name="dosage"
            required
            placeholder="Ex.: 10mg/kg, 1 comprimido"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand-500/60 focus:outline-none"
          />
          {state.fieldErrors?.dosage && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.dosage[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Frequência <span className="text-danger">*</span>
          </label>
          <input
            name="frequency"
            required
            placeholder="Ex.: 2x ao dia, a cada 8h"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand-500/60 focus:outline-none"
          />
          {state.fieldErrors?.frequency && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.frequency[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Data de início <span className="text-danger">*</span>
          </label>
          <input
            name="start_date"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-brand-500/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Previsão de término
          </label>
          <input
            name="end_date"
            type="date"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-brand-500/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Motivo
          </label>
          <input
            name="reason"
            placeholder="Ex.: Infecção, dor crônica"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand-500/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-ink-600/50 px-3 py-2.5">
          <input
            name="is_ongoing"
            id="is_ongoing"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 accent-brand-500"
          />
          <label htmlFor="is_ongoing" className="text-sm text-fg-muted cursor-pointer">
            Medicação contínua (sem prazo de término)
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Observações
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Efeitos, cuidados especiais…"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand-500/60 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow-brand transition hover:bg-brand-400 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Salvar medicação
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-fg-muted hover:text-fg">
          Cancelar
        </button>
      </div>
    </form>
  );
}
