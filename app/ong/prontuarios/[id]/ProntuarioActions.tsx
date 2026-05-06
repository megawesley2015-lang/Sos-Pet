"use client";

import { useTransition } from "react";
import { atualizarSaudeAction } from "./actions";

const SAUDE_OPTIONS = [
  { value: "critica",   label: "Crítica" },
  { value: "regular",  label: "Regular" },
  { value: "boa",      label: "Boa" },
  { value: "excelente",label: "Excelente" },
];

export function ProntuarioActions({ prontuarioId }: { prontuarioId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        data.append("prontuario_id", prontuarioId);
        startTransition(() => atualizarSaudeAction(data));
      }}
      className="flex items-center gap-2"
    >
      <label className="text-xs text-fg-muted">Alterar saúde:</label>
      <select
        name="situacao_saude"
        className="rounded-lg border border-white/10 bg-ink-700 px-2 py-1 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        {SAUDE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-ink-600 px-2.5 py-1 text-xs font-bold text-fg hover:bg-ink-500 disabled:opacity-50"
      >
        {pending ? "…" : "Salvar"}
      </button>
    </form>
  );
}
