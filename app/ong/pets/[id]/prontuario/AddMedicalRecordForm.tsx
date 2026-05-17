"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { addMedicalRecord } from "./actions";
import type { MedRecordState } from "./actions";
import { useState } from "react";

const initialState: MedRecordState = {};

export function AddMedicalRecordForm({ petId }: { petId: string }) {
  const [open, setOpen] = useState(false);

  // Bind petId no action
  const boundAction = addMedicalRecord.bind(null, petId);
  const [state, action, isPending] = useActionState(boundAction, initialState);

  // Fecha form após sucesso
  if (state.success && open) setOpen(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-500/30 py-3 text-sm font-bold text-cyan-300 transition hover:border-cyan-500/60 hover:bg-cyan-500/5"
      >
        <Plus className="h-4 w-4" />
        Novo registro no prontuário
      </button>
    );
  }

  return (
    <form
      action={action}
      className="rounded-xl border border-cyan-500/30 bg-ink-700/50 p-5"
    >
      <h3 className="mb-4 text-sm font-semibold text-fg">Novo registro</h3>

      {state.error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Tipo <span className="text-danger">*</span>
          </label>
          <select
            name="type"
            required
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
          >
            <option value="consultation">Consulta</option>
            <option value="exam">Exame</option>
            <option value="treatment">Tratamento</option>
            <option value="surgery">Cirurgia</option>
            <option value="observation">Observação</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Data
          </label>
          <input
            name="record_date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Descrição <span className="text-danger">*</span>
          </label>
          <textarea
            name="description"
            required
            rows={3}
            placeholder="Descreva o procedimento, resultado ou observação…"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
          />
          {state.fieldErrors?.description && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.description[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Veterinário responsável
          </label>
          <input
            name="vet_name"
            placeholder="Nome do vet"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
          />
        </div>

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
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Observações adicionais
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Recomendações, próximos passos…"
            className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-ink-900 transition hover:bg-cyan-400 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Salvar registro
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-fg-muted hover:text-fg"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
