"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { resolveAction, reactivateAction } from "./resolveAction";

interface ResolveButtonProps {
  petId: string;
  kind: "lost" | "found";
}

/**
 * Botão "Meu pet voltou!" / "Devolvi o pet" — exibido ao dono na página de detalhe.
 *
 * Abre um pequeno diálogo de confirmação inline antes de chamar a Server Action.
 * Usa useTransition para mostrar spinner durante o redirect.
 */
export function ResolveButton({ petId, kind }: ResolveButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const label = kind === "lost" ? "Meu pet voltou! 🎉" : "Devolvi o pet 🎉";
  const confirmText =
    kind === "lost"
      ? "Ótima notícia! Marcar como reencontrado remove o registro da listagem pública."
      : "Legal! Marcar como devolvido remove o registro da listagem pública.";

  function handleConfirm() {
    startTransition(async () => {
      await resolveAction(petId);
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3">
        <p className="text-xs text-green-300">{confirmText}</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-500 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {isPending ? "Salvando…" : "Confirmar"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-fg-muted transition hover:bg-white/5 disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-green-500/50 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-300 transition hover:bg-green-500/20"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

interface ReactivateButtonProps {
  petId: string;
}

/**
 * Botão "Reativar registro" — visível ao dono na página de pet resolvido.
 * Permite desfazer caso o pet tenha fugido novamente.
 */
export function ReactivateButton({ petId }: ReactivateButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleReactivate() {
    startTransition(async () => {
      await reactivateAction(petId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleReactivate}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold text-fg-muted transition hover:bg-white/10 disabled:opacity-60"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RotateCcw className="h-4 w-4" />
      )}
      {isPending ? "Reativando…" : "Reativar registro"}
    </button>
  );
}
