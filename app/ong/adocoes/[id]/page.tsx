"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Skull,
  ArrowRightLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  PawPrint,
  Save,
} from "lucide-react";
import { updateFollowUp } from "../actions";
import type { AdoptionFormState } from "../actions";

const STATUS_CONFIG = {
  active:      { label: "Ativo",       color: "border-success/40 bg-success/10 text-success",        icon: CheckCircle2 },
  returned:    { label: "Devolvido",   color: "border-danger/40 bg-danger/10 text-danger",             icon: RotateCcw },
  deceased:    { label: "Falecido",    color: "border-fg-subtle/40 bg-ink-600/40 text-fg-subtle",      icon: Skull },
  transferred: { label: "Transferido", color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",       icon: ArrowRightLeft },
} as const;

type AdoptionStatus = keyof typeof STATUS_CONFIG;

interface Adoption {
  id: string;
  adopter_name: string;
  adopter_phone: string;
  adopter_email: string | null;
  adopter_city: string;
  adopter_neighborhood: string | null;
  adoption_date: string;
  follow_up_30_date: string | null;
  follow_up_30_notes: string | null;
  follow_up_90_date: string | null;
  follow_up_90_notes: string | null;
  status: AdoptionStatus;
  shelter_pets: { name: string | null; species: string } | null;
}

const initialState: AdoptionFormState = {};

/**
 * /ong/adocoes/[id] — Detalhe + edição inline de acompanhamento pós-adoção.
 *
 * Client Component porque:
 *  1. Precisa chamar updateFollowUp (Server Action com bind do adoptionId)
 *  2. Exibe feedback otimista após save
 *
 * Dados carregados via API route para evitar redirect auth no client.
 */
export default function AdocaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [adoption, setAdoption] = useState<Adoption | null>(null);
  const [loading, setLoading] = useState(true);
  const [adoptionId, setAdoptionId] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setAdoptionId(id);
      fetch(`/api/ong/adoption/${id}`)
        .then((r) => {
          if (r.status === 401) { router.push("/login?next=/ong/adocoes"); return null; }
          if (r.status === 404) { router.push("/ong/adocoes"); return null; }
          return r.json();
        })
        .then((data) => {
          if (data?.adoption) setAdoption(data.adoption);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [params, router]);

  const boundAction = updateFollowUp.bind(null, adoptionId);
  const [state, action, isPending] = useActionState(boundAction, initialState);

  const SPECIES_EMOJI: Record<string, string> = { dog: "🐶", cat: "🐱", other: "🐾" };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fg-subtle" />
      </div>
    );
  }

  if (!adoption) return null;

  const cfg = STATUS_CONFIG[adoption.status];
  const StatusIcon = cfg.icon;
  const emoji = SPECIES_EMOJI[adoption.shelter_pets?.species ?? "other"];
  const today = new Date().toISOString().split("T")[0];
  const f30overdue = adoption.follow_up_30_date && adoption.follow_up_30_date <= today && adoption.status === "active";
  const f90overdue = adoption.follow_up_90_date && adoption.follow_up_90_date <= today && adoption.status === "active";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/ong/adocoes"
          className="rounded-lg p-2 text-fg-muted hover:bg-ink-700 hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <h1 className="font-display text-xl font-bold text-fg">
              {adoption.shelter_pets?.name ?? "Pet sem nome"}
            </h1>
            <span className="text-fg-subtle">→</span>
            <span className="text-sm font-semibold text-fg">{adoption.adopter_name}</span>
            <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${cfg.color}`}>
              <StatusIcon className="h-3 w-3" />
              {cfg.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-fg-muted">
            Adotado em {new Date(adoption.adoption_date).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Dados do adotante */}
      <section className="rounded-xl border border-white/10 bg-ink-700/50 p-5">
        <h2 className="mb-4 text-sm font-semibold text-fg">Dados do adotante</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 shrink-0 text-fg-subtle" />
            <a
              href={`tel:${adoption.adopter_phone}`}
              className="text-cyan-400 hover:underline"
            >
              {adoption.adopter_phone}
            </a>
          </div>
          {adoption.adopter_email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-fg-subtle" />
              <a
                href={`mailto:${adoption.adopter_email}`}
                className="text-cyan-400 hover:underline truncate"
              >
                {adoption.adopter_email}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <MapPin className="h-4 w-4 shrink-0 text-fg-subtle" />
            {adoption.adopter_neighborhood
              ? `${adoption.adopter_neighborhood}, ${adoption.adopter_city}`
              : adoption.adopter_city}
          </div>
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <Calendar className="h-4 w-4 shrink-0 text-fg-subtle" />
            Adoção: {new Date(adoption.adoption_date).toLocaleDateString("pt-BR")}
          </div>
        </div>
      </section>

      {/* Formulário de acompanhamento */}
      <section className="rounded-xl border border-cyan-500/20 bg-ink-700/50 p-5">
        <h2 className="mb-1 text-sm font-semibold text-fg">Acompanhamento pós-adoção</h2>
        <p className="mb-4 text-xs text-fg-muted">
          Registre os checkpoints de 30 e 90 dias. Datas vencidas aparecem em destaque na lista.
        </p>

        {state.success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Acompanhamento salvo com sucesso.
          </div>
        )}
        {state.error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-5">
          {/* Status */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">
              Status da adoção
            </label>
            <select
              name="status"
              defaultValue={adoption.status}
              className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2.5 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
            >
              <option value="active">Ativo — adoção em andamento</option>
              <option value="returned">Devolvido</option>
              <option value="deceased">Falecido</option>
              <option value="transferred">Transferido</option>
            </select>
          </div>

          {/* 30 dias */}
          <div className="rounded-lg border border-white/5 bg-ink-600/40 p-4">
            <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${f30overdue ? "text-brand-300" : "text-fg-muted"}`}>
              {f30overdue ? "⚠️ " : ""}Checkpoint 30 dias
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-muted">Data</label>
                <input
                  type="date"
                  name="follow_up_30_date"
                  defaultValue={adoption.follow_up_30_date ?? ""}
                  className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-muted">Observações</label>
                <input
                  name="follow_up_30_notes"
                  maxLength={500}
                  defaultValue={adoption.follow_up_30_notes ?? ""}
                  placeholder="Ex.: Ligação realizada, pet bem adaptado"
                  className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 90 dias */}
          <div className="rounded-lg border border-white/5 bg-ink-600/40 p-4">
            <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${f90overdue ? "text-brand-300" : "text-fg-muted"}`}>
              {f90overdue ? "⚠️ " : ""}Checkpoint 90 dias
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-muted">Data</label>
                <input
                  type="date"
                  name="follow_up_90_date"
                  defaultValue={adoption.follow_up_90_date ?? ""}
                  className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2 text-sm text-fg focus:border-cyan-500/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-muted">Observações</label>
                <input
                  name="follow_up_90_notes"
                  maxLength={500}
                  defaultValue={adoption.follow_up_90_notes ?? ""}
                  placeholder="Ex.: Visita domiciliar agendada"
                  className="w-full rounded-lg border border-white/10 bg-ink-600 px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-cyan-500/60 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow-brand transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</>
            ) : (
              <><Save className="h-4 w-4" /> Salvar acompanhamento</>
            )}
          </button>
        </form>
      </section>

      {/* Link para pet */}
      <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-ink-700/30 px-4 py-3">
        <PawPrint className="h-4 w-4 shrink-0 text-brand-400" />
        <p className="flex-1 text-sm text-fg-muted">
          Ver prontuário e ficha do pet adotado
        </p>
        <Link
          href={`/ong/pets?status=adopted`}
          className="text-xs text-cyan-400 hover:text-cyan-300"
        >
          Ver pets adotados →
        </Link>
      </div>
    </div>
  );
}
