"use client";

import { useTransition } from "react";
import { AlertCircle } from "lucide-react";
import { marcarAcompanhamentoAction } from "./actions";

export function AcompanhamentoActions({
  adocaoId, field, label,
}: {
  adocaoId: string; field: string; label: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const data = new FormData();
        data.append("adocao_id", adocaoId);
        data.append("field", field);
        startTransition(() => marcarAcompanhamentoAction(data));
      }}
      className="flex items-center gap-1 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-bold text-yellow-400 hover:bg-yellow-400/20 disabled:opacity-50"
    >
      <AlertCircle className="h-3 w-3" />
      {pending ? "…" : `Confirmar ${label}`}
    </button>
  );
}
