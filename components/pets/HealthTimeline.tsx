"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Syringe, Pill, Stethoscope, Activity, Trash2, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createHealthRecordAction, deleteHealthRecordAction } from "@/app/pets/[id]/health-actions";
import type { PetSaudeRow } from "@/lib/types/database";

const ICON_MAP: Record<string, React.ReactNode> = {
  vacina: <Syringe className="h-4 w-4" />,
  medicamento: <Pill className="h-4 w-4" />,
  exame: <Stethoscope className="h-4 w-4" />,
  outro: <Activity className="h-4 w-4" />,
};

interface HealthTimelineProps {
  petId: string;
  initialRecords: PetSaudeRow[];
  isOwner: boolean;
}

export function HealthTimeline({ petId, initialRecords, isOwner }: HealthTimelineProps) {
  const [records, setRecords] = useState<PetSaudeRow[]>(initialRecords);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Escuta mudanças em tempo real na tabela pet_saude filtrando por pet_id
    const supabase = createClient();
    
    const channel = supabase
      .channel(`pet_saude_changes_${petId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pet_saude",
          filter: `pet_id=eq.${petId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newRecord = payload.new as PetSaudeRow;
            setRecords((prev) => [newRecord, ...prev].sort((a, b) => new Date(b.data_aplicacao ?? '').getTime() - new Date(a.data_aplicacao ?? '').getTime()));
          } else if (payload.eventType === "DELETE") {
            setRecords((prev) => prev.filter((r) => r.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as PetSaudeRow;
            setRecords((prev) => prev.map((r) => r.id === updated.id ? updated : r).sort((a, b) => new Date(b.data_aplicacao ?? '').getTime() - new Date(a.data_aplicacao ?? '').getTime()));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [petId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    
    setIsSubmitting(true);
    const formData = new FormData(formRef.current);
    formData.append("pet_id", petId);
    
    try {
      const res = await createHealthRecordAction(formData);
      if (res.ok) {
        setIsAdding(false);
        formRef.current.reset();
      } else {
        alert(res.message || "Erro ao adicionar registro.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este registro?")) return;
    setDeletingId(id);
    try {
      await deleteHealthRecordAction(id, petId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-700/40 p-5 sm:p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-fg">Carteira de Saúde</h2>
          <p className="text-xs text-fg-muted">Histórico médico, vacinas e medicamentos.</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-400 hover:bg-brand-500/20"
          >
            <Plus className={`h-4 w-4 transition-transform ${isAdding ? "rotate-45" : ""}`} />
            {isAdding ? "Cancelar" : "Adicionar"}
          </button>
        )}
      </div>

      {isAdding && isOwner && (
        <form ref={formRef} onSubmit={handleSubmit} className="mb-8 rounded-xl border border-white/10 bg-ink-800 p-4 shadow-lg">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-fg-muted">Tipo</label>
              <select
                name="tipo"
                required
                className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="vacina">Vacina</option>
                <option value="medicamento">Medicamento / Vermífugo</option>
                <option value="exame">Exame / Consulta</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-fg-muted">Nome do Registro</label>
              <input
                type="text"
                name="nome"
                required
                placeholder="Ex: V10, Bravecto"
                className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-fg-muted">Data da Aplicação</label>
              <input
                type="date"
                name="data_aplicacao"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-fg-muted">Próxima Dose (Opcional)</label>
              <input
                type="date"
                name="proxima_dose"
                className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-fg-muted">
              <input type="checkbox" name="notificar" className="rounded border-white/20 bg-ink-900 text-brand-500" />
              Notificar quando estiver perto de vencer
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-400 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Salvar
            </button>
          </div>
        </form>
      )}

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="mb-2 h-8 w-8 text-white/10" />
          <p className="text-sm text-fg-muted">Nenhum registro de saúde cadastrado.</p>
        </div>
      ) : (
        <div className="relative border-l border-white/10 pl-6 space-y-6">
          {records.map((record) => {
            const isDueSoon = record.proxima_dose && new Date(record.proxima_dose).getTime() - new Date().getTime() < 1000 * 60 * 60 * 24 * 7;
            const isOverdue = record.proxima_dose && new Date(record.proxima_dose).getTime() < new Date().getTime();
            
            return (
              <div key={record.id} className="relative">
                {/* Indicador visual na linha do tempo */}
                <div className={`absolute -left-[35px] flex h-7 w-7 items-center justify-center rounded-full border-4 border-ink-800 ${
                  isOverdue ? "bg-danger" : isDueSoon ? "bg-brand-500" : "bg-cyan-500"
                } text-white`}>
                  {ICON_MAP[record.tipo] || <Activity className="h-3 w-3" />}
                </div>

                <div className={`rounded-xl border p-4 ${
                  isOverdue ? "border-danger/30 bg-danger/5" : isDueSoon ? "border-brand-500/30 bg-brand-500/5" : "border-white/5 bg-ink-800/50"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-fg">{record.nome}</h3>
                      <p className="text-xs text-fg-muted">
                        Aplicado em {record.data_aplicacao ? new Date(record.data_aplicacao).toLocaleDateString("pt-BR") : ''}
                      </p>
                      
                      {record.proxima_dose && (
                        <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                          isOverdue ? "text-danger-fg" : isDueSoon ? "text-brand-300" : "text-cyan-400"
                        }`}>
                          <AlertCircle className="h-3.5 w-3.5" />
                          {isOverdue ? "Venceu em " : "Próxima dose em "} 
                          {new Date(record.proxima_dose).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>
                    
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={deletingId === record.id}
                        className="p-1.5 text-fg-subtle hover:text-danger-fg disabled:opacity-50"
                        title="Remover"
                      >
                        {deletingId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
