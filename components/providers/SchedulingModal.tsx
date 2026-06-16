"use client";

import { useState } from "react";
import { Calendar, Clock, Loader2, X, MessageCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SchedulingModalProps {
  prestadorId: string;
  phone: string;
  prestadorNome: string;
  horarios?: Record<string, unknown> | null;
  dias?: Record<string, unknown> | null;
}

const SERVICOS_COMUNS = [
  "Banho e Tosa",
  "Consulta Veterinária",
  "Vacinação",
  "Adestramento",
  "Hospedagem",
  "Passeio",
];

const DIAS_SEMANA: Record<string, string> = {
  seg: "Seg", ter: "Ter", qua: "Qua",
  qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom",
};

export function SchedulingModal({
  prestadorId,
  phone,
  prestadorNome,
  horarios,
  dias,
}: SchedulingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    petNome: "",
    data: "",
    horario: "",
    servico: "",
    servicoCustom: "",
  });

  // Dias disponíveis (do banco, se preenchido)
  const diasDisponiveis = dias
    ? Object.entries(dias)
        .filter(([, v]) => v === true)
        .map(([k]) => DIAS_SEMANA[k] ?? k)
    : [];

  const horarioInicio =
    typeof horarios?.inicio === "string" ? horarios.inicio : null;
  const horarioFim = typeof horarios?.fim === "string" ? horarios.fim : null;

  const servicoFinal = formData.servico === "__custom__"
    ? formData.servicoCustom
    : formData.servico;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicoFinal.trim()) return;
    setIsSubmitting(true);

    try {
      // Registrar clique via browser client (sem depender do server)
      const supabase = createClient();
      await supabase.rpc("incrementar_clique_whatsapp", { p_id: prestadorId } as any).then(() => {});

      const dataFormatada = formData.data
        ? new Date(formData.data + "T12:00:00").toLocaleDateString("pt-BR")
        : "a combinar";

      const horarioFormatado = formData.horario || "a combinar";

      const texto =
        `Olá ${prestadorNome}! Vim pelo SOS Pet Aumigo e gostaria de agendar um horário. 🐾\n\n` +
        `*Nome:* ${formData.nome}\n` +
        `*Pet:* ${formData.petNome}\n` +
        `*Serviço:* ${servicoFinal}\n` +
        `*Data:* ${dataFormatada}\n` +
        `*Horário:* ${horarioFormatado}\n\n` +
        `Podemos confirmar?`;

      const url = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
      window.open(url, "_blank");
      setIsDone(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsDone(false);
    setFormData({ nome: "", petNome: "", data: "", horario: "", servico: "", servicoCustom: "" });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400 active:scale-95 sm:flex-none"
      >
        <Calendar className="h-5 w-5" />
        Agendar Horário
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 backdrop-blur-sm sm:items-center"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="relative w-full max-w-md rounded-t-3xl border border-white/10 bg-ink-800 p-6 shadow-2xl sm:rounded-2xl">
            {/* Handle móvel */}
            <div className="absolute left-1/2 top-3 h-1 w-12 -translate-x-1/2 rounded-full bg-white/20 sm:hidden" />

            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-1 text-fg-muted hover:bg-white/5 hover:text-fg"
            >
              <X className="h-5 w-5" />
            </button>

            {isDone ? (
              /* Estado de sucesso */
              <div className="flex flex-col items-center py-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="font-display text-xl font-bold text-fg">Solicitação enviada!</h2>
                <p className="mt-2 text-sm text-fg-muted">
                  O WhatsApp foi aberto com sua mensagem pré-preenchida. Aguarde a confirmação de{" "}
                  <span className="font-semibold text-fg">{prestadorNome}</span>.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-6 rounded-xl border border-white/10 px-6 py-2.5 text-sm font-bold text-fg hover:bg-white/5"
                >
                  Fechar
                </button>
              </div>
            ) : (
              /* Formulário */
              <>
                <div className="mb-5">
                  <h2 className="font-display text-xl font-bold text-fg">
                    Agendar com {prestadorNome}
                  </h2>
                  <p className="mt-1 text-sm text-fg-muted">
                    Vamos montar a mensagem de agendamento para o WhatsApp.
                  </p>
                </div>

                {/* Info de disponibilidade */}
                {(diasDisponiveis.length > 0 || horarioInicio) && (
                  <div className="mb-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-cyan-400 mb-1.5">
                      Horários disponíveis
                    </p>
                    {diasDisponiveis.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {diasDisponiveis.map((d) => (
                          <span key={d} className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                    {horarioInicio && horarioFim && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-fg-muted">
                        <Clock className="h-3 w-3" />
                        {horarioInicio} às {horarioFim}
                      </p>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-fg-muted">
                        Seu Nome
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-fg placeholder:text-fg-muted/40 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        placeholder="João Silva"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-fg-muted">
                        Nome do Pet
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.petNome}
                        onChange={(e) => setFormData({ ...formData, petNome: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-fg placeholder:text-fg-muted/40 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        placeholder="Rex"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-fg-muted">
                      Serviço
                    </label>
                    <select
                      required
                      value={formData.servico}
                      onChange={(e) => setFormData({ ...formData, servico: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">Selecione...</option>
                      {SERVICOS_COMUNS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="__custom__">Outro serviço...</option>
                    </select>
                    {formData.servico === "__custom__" && (
                      <input
                        required
                        type="text"
                        value={formData.servicoCustom}
                        onChange={(e) => setFormData({ ...formData, servicoCustom: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-fg placeholder:text-fg-muted/40 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        placeholder="Descreva o serviço..."
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-fg-muted">
                        Data preferida
                      </label>
                      <input
                        type="date"
                        value={formData.data}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-fg-muted">
                        Horário preferido
                      </label>
                      <input
                        type="time"
                        value={formData.horario}
                        onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-bold text-white transition-all hover:bg-[#1ebd5b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <MessageCircle className="h-5 w-5" />
                    )}
                    Enviar pelo WhatsApp
                  </button>

                  <p className="text-center text-[11px] text-fg-subtle">
                    Data e horário são sugestões — o prestador confirma disponibilidade.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
