"use client";

import { useTransition, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { adicionarMedicacaoAction } from "./actions";

export function MedicacaoForm({ prontuarioId }: { prontuarioId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = new FormData(formRef.current!);
    data.append("prontuario_id", prontuarioId);
    startTransition(async () => {
      await adicionarMedicacaoAction(data);
      formRef.current?.reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-500/40 py-2.5 text-sm text-brand-400 hover:border-brand-500/70 hover:bg-brand-500/5"
      >
        <Plus className="h-4 w-4" /> Registrar medicação
      </button>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-3 rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-300">Nova medicação</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input name="nome" required placeholder="Nome do medicamento *" className="input" />
        <input name="dosagem" placeholder="Dosagem (ex: 10mg)" className="input" />
        <input name="frequencia" placeholder="Frequência (ex: 2x ao dia)" className="input" />
        <input name="data_inicio" required type="date" className="input" />
        <input name="data_fim" type="date" placeholder="Data de término" className="input" />
        <input name="observacao" placeholder="Observação" className="input sm:col-span-2" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-400 disabled:opacity-50">
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-fg-muted hover:text-fg">
          Cancelar
        </button>
      </div>
    </form>
  );
}
