"use client";

import { useTransition, useRef, useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { adicionarVacinaAction } from "./actions";

export function VacinaForm({ prontuarioId }: { prontuarioId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = new FormData(formRef.current!);
    data.append("prontuario_id", prontuarioId);
    startTransition(async () => {
      await adicionarVacinaAction(data);
      formRef.current?.reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-cyan-500/40 py-2.5 text-sm text-cyan-400 hover:border-cyan-500/70 hover:bg-cyan-500/5"
      >
        <Plus className="h-4 w-4" /> Registrar vacina
      </button>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Nova vacina</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input name="nome" required placeholder="Nome da vacina *" className="input" />
        <input name="data_aplicacao" required type="date" className="input" />
        <input name="proxima_dose" type="date" placeholder="Próxima dose" className="input" />
        <input name="veterinario" placeholder="Veterinário" className="input" />
        <input name="lote" placeholder="Lote" className="input" />
        <input name="observacao" placeholder="Observação" className="input sm:col-span-2" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-400 disabled:opacity-50">
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
