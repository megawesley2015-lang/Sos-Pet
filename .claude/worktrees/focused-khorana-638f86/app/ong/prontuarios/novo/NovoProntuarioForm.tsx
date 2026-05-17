"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { criarProntuarioAction } from "./actions";

interface Props {
  ongId: string;
  pets: { id: string; name: string; species: string }[];
}

const SPECIES: Record<string, string> = { dog: "🐕", cat: "🐈", other: "🐾" };

export function NovoProntuarioForm({ ongId, pets }: Props) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = new FormData(formRef.current!);
    data.append("ong_id", ongId);
    startTransition(async () => {
      const result = await criarProntuarioAction(data);
      if (result?.id) {
        router.push(`/ong/prontuarios/${result.id}`);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className="max-w-lg space-y-4 rounded-xl border border-white/10 bg-ink-700/40 p-6">
      <div className="flex items-center gap-2 text-sm font-bold text-fg-muted">
        <ClipboardList className="h-4 w-4" />
        Dados do resgate
      </div>

      {/* Seleção do pet */}
      <div>
        <label className="mb-1 block text-xs font-bold text-fg-muted">Pet resgatado *</label>
        {pets.length > 0 ? (
          <select name="pet_id" required className="input w-full">
            <option value="">Selecione o pet</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {SPECIES[p.species]} {p.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3">
            <p className="text-sm text-yellow-300">
              Nenhum pet cadastrado ainda.{" "}
              <a href="/pets/novo" className="underline">
                Cadastre um pet primeiro →
              </a>
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold text-fg-muted">Data do resgate *</label>
          <input
            name="data_resgate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="input w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-fg-muted">Situação de saúde *</label>
          <select name="situacao_saude" required className="input w-full">
            <option value="boa">Boa</option>
            <option value="excelente">Excelente</option>
            <option value="regular">Regular</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-fg-muted">Peso (kg)</label>
          <input name="peso_kg" type="number" step="0.1" min="0" placeholder="Ex: 4.5" className="input w-full" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-fg-muted">Microchip</label>
          <input name="microchip" placeholder="Número do microchip" className="input w-full" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" name="castrado" id="castrado" value="true" className="h-4 w-4 rounded" />
        <label htmlFor="castrado" className="text-sm text-fg">Pet castrado(a)</label>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-fg-muted">Observações gerais</label>
        <textarea
          name="observacoes"
          rows={3}
          placeholder="Comportamento, histórico, particularidades…"
          className="input w-full resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending || pets.length === 0}
        className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Criando prontuário…" : "Criar prontuário"}
      </button>
    </form>
  );
}
