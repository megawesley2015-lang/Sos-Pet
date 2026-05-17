"use client";

import { useState, useTransition, useRef } from "react";
import { Plus, Users } from "lucide-react";
import { registrarAdocaoAction } from "./actions";

interface Props {
  ongId: string;
  pets: { prontuarioId: string; petId: string; petName: string }[];
}

export function NovaAdocaoModal({ ongId, pets }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = new FormData(formRef.current!);
    data.append("ong_id", ongId);
    startTransition(async () => {
      await registrarAdocaoAction(data);
      formRef.current?.reset();
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-bold text-white hover:bg-brand-400"
      >
        <Plus className="h-4 w-4" /> Registrar adoção
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-ink-800 p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-400" />
              <h2 className="font-display text-lg font-bold text-fg">Nova adoção</h2>
            </div>

            <form ref={formRef} onSubmit={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-fg-muted">Pet adotado *</label>
                <select name="pet_id" required className="input w-full">
                  <option value="">Selecione o pet</option>
                  {pets.map((p) => (
                    <option key={p.petId} value={p.petId}>{p.petName}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-fg-muted">Nome do adotante *</label>
                  <input name="adotante_nome" required placeholder="Nome completo" className="input w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-fg-muted">Telefone *</label>
                  <input name="adotante_telefone" required placeholder="(13) 99999-9999" className="input w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-fg-muted">E-mail</label>
                  <input name="adotante_email" type="email" placeholder="email@exemplo.com" className="input w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-fg-muted">CPF</label>
                  <input name="adotante_cpf" placeholder="000.000.000-00" className="input w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-fg-muted">Data da adoção *</label>
                  <input name="data_adocao" required type="date" className="input w-full"
                    defaultValue={new Date().toISOString().slice(0, 10)} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-fg-muted">Observações</label>
                <textarea name="observacoes" rows={2} placeholder="Informações adicionais…" className="input w-full resize-none" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={pending}
                  className="flex-1 rounded-lg bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-400 disabled:opacity-50">
                  {pending ? "Registrando…" : "Registrar adoção"}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-fg-muted hover:text-fg">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
