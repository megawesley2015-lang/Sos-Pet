"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Trash2 } from "lucide-react";
import { StarRating } from "./StarRating";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormAlert } from "@/components/auth/FormAlert";
import {
  submitReviewAction,
  deleteReviewAction,
  type ReviewState,
} from "@/app/prestadores/[slug]/actions";
import type { AvaliacaoRow } from "@/lib/types/database";

interface AvaliacaoFormProps {
  prestadorId: string;
  slug: string;
  isLoggedIn: boolean;
  myReview: AvaliacaoRow | null;
}

const initial: ReviewState = {};

export function AvaliacaoForm({
  prestadorId,
  slug,
  isLoggedIn,
  myReview,
}: AvaliacaoFormProps) {
  const boundAction = (state: ReviewState, formData: FormData) =>
    submitReviewAction(slug, state, formData);

  const [state, formAction] = useActionState(boundAction, initial);
  const [deletePending, startDelete] = useTransition();

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-white/10 bg-ink-700/50 p-4 text-center">
        <p className="text-sm text-fg-muted">
          <Link
            href={`/login?next=/prestadores/${slug}`}
            className="font-bold text-cyan-400 hover:text-cyan-300"
          >
            Entre
          </Link>{" "}
          para deixar sua avaliação.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-3">
      <input type="hidden" name="prestador_id" value={prestadorId} />

      {state.message && state.ok && (
        <div className="flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-3 text-xs text-cyan-100">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      )}
      {state.message && !state.ok && (
        <FormAlert type="error" message={state.message} />
      )}

      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-fg-muted">
          {myReview ? "Sua nota" : "Dê uma nota"}
        </p>
        <StarRating
          name="nota"
          defaultValue={myReview?.nota ?? 0}
          size="lg"
        />
        {state.errors?.nota && (
          <p className="mt-1 text-xs text-danger-fg">{state.errors.nota}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="comentario"
          className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-fg-muted"
        >
          Comentário (opcional)
        </label>
        <textarea
          id="comentario"
          name="comentario"
          rows={3}
          maxLength={500}
          defaultValue={myReview?.comentario ?? ""}
          placeholder="O que achou do atendimento? Recomenda?"
          className={`w-full rounded-lg border bg-ink-800/70 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle/70 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
            state.errors?.comentario
              ? "border-danger/60 focus:border-danger"
              : "border-white/10 focus:border-brand-500/60"
          }`}
        />
        {state.errors?.comentario && (
          <p className="mt-1 text-xs text-danger-fg">
            {state.errors.comentario}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        {myReview && (
          <button
            type="button"
            disabled={deletePending}
            onClick={() => {
              if (confirm("Excluir sua avaliação?")) {
                startDelete(async () => {
                  await deleteReviewAction(myReview.id, slug);
                });
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-danger-fg disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deletePending ? "Excluindo…" : "Excluir minha avaliação"}
          </button>
        )}
        <div className="ml-auto">
          <SubmitButton pendingLabel="Salvando…">
            {myReview ? "Atualizar avaliação" : "Enviar avaliação"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
