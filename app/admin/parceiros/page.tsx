import { Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ParceiroRow } from "@/lib/types/database";
import { aprovarParceiroAction, rejeitarParceiroAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Parceiros" };

const STATUS_MAP: Record<string, { label: string; classes: string; icon: React.ElementType }> = {
  pendente:  { label: "Pendente",  classes: "bg-brand-500/15 text-brand-300", icon: Clock },
  aprovado:  { label: "Aprovado",  classes: "bg-success/15 text-success",     icon: CheckCircle },
  rejeitado: { label: "Rejeitado", classes: "bg-white/5 text-fg-subtle",      icon: XCircle },
};

export default async function AdminParceirosPage() {
  const supabase = await createSupabaseServerClient();

  const { data: parceiros } = await supabase
    .from("parceiros")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const lista = (parceiros ?? []) as ParceiroRow[];
  const pendentes = lista.filter((p) => p.status === "pendente");
  const respondidos = lista.filter((p) => p.status !== "pendente");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Parceiros</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {lista.length} solicitações · {pendentes.length} aguardando resposta
        </p>
      </div>

      {pendentes.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-400">
            Aguardando resposta ({pendentes.length})
          </h2>
          <div className="space-y-3">
            {pendentes.map((p) => (
              <ParceiroCard key={p.id} parceiro={p} />
            ))}
          </div>
        </section>
      )}

      {respondidos.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-fg-subtle">
            Respondidos ({respondidos.length})
          </h2>
          <div className="space-y-2">
            {respondidos.map((p) => (
              <ParceiroCard key={p.id} parceiro={p} />
            ))}
          </div>
        </section>
      )}

      {lista.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 bg-ink-700/40 p-10 text-center text-sm text-fg-muted">
          Nenhuma solicitação de parceria recebida ainda.
        </div>
      )}
    </div>
  );
}

function ParceiroCard({ parceiro: p }: { parceiro: ParceiroRow }) {
  const st = STATUS_MAP[p.status] ?? STATUS_MAP.pendente;
  const StatusIcon = st.icon;
  const isPendente = p.status === "pendente";

  return (
    <div
      className={`rounded-xl border p-4 ${
        isPendente
          ? "border-brand-500/30 bg-brand-500/5"
          : "border-white/10 bg-ink-700/40"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-fg">{p.nome}</span>
            {p.empresa && (
              <span className="text-xs text-fg-muted">· {p.empresa}</span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${st.classes}`}
            >
              <StatusIcon className="h-3 w-3" />
              {st.label}
            </span>
          </div>

          <a
            href={`mailto:${p.email}`}
            className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
          >
            <Mail className="h-3 w-3" />
            {p.email}
          </a>

          {p.mensagem && (
            <p className="mt-2 line-clamp-3 text-xs text-fg-subtle">
              {p.mensagem}
            </p>
          )}

          <p className="mt-1.5 text-[10px] text-fg-subtle">
            Recebido em {new Date(p.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {isPendente && (
          <div className="flex shrink-0 gap-2">
            <form
              action={async () => {
                "use server";
                await aprovarParceiroAction(p.id);
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/25"
              >
                <CheckCircle className="h-3 w-3" />
                Aprovar
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await rejeitarParceiroAction(p.id);
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-danger/15 px-3 py-1.5 text-xs font-medium text-danger-fg hover:bg-danger/25"
              >
                <XCircle className="h-3 w-3" />
                Rejeitar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
