import Link from "next/link";
import { Building2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PrestadorRow } from "@/lib/types/database";
import { aprovarPrestadorAction, rejeitarPrestadorAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Prestadores" };

const STATUS_LABEL: Record<string, { label: string; classes: string }> = {
  ativo: { label: "Ativo", classes: "bg-success/15 text-success" },
  pausado: { label: "Pausado", classes: "bg-white/5 text-fg-subtle" },
  pendente_aprovacao: { label: "Pendente", classes: "bg-brand-500/15 text-brand-300" },
};

export default async function AdminPrestadoresPage() {
  const supabase = await createSupabaseServerClient();

  const { data: prestadores } = await supabase
    .from("prestadores")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const lista = (prestadores ?? []) as PrestadorRow[];
  const pendentes = lista.filter((p) => p.status === "pendente_aprovacao");
  const demais = lista.filter((p) => p.status !== "pendente_aprovacao");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Prestadores</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {lista.length} prestadores · {pendentes.length} aguardando aprovação
        </p>
      </div>

      {/* Pendentes — aparecem primeiro com destaque */}
      {pendentes.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-400">
            Aguardando aprovação ({pendentes.length})
          </h2>
          <div className="space-y-3">
            {pendentes.map((p) => (
              <PrestadorCard key={p.id} prestador={p} destacado />
            ))}
          </div>
        </section>
      )}

      {/* Todos os outros */}
      {demais.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-fg-subtle">
            Demais prestadores ({demais.length})
          </h2>
          <div className="space-y-2">
            {demais.map((p) => (
              <PrestadorCard key={p.id} prestador={p} />
            ))}
          </div>
        </section>
      )}

      {lista.length === 0 && (
        <Empty mensagem="Nenhum prestador cadastrado ainda." />
      )}
    </div>
  );
}

function PrestadorCard({
  prestador: p,
  destacado = false,
}: {
  prestador: PrestadorRow;
  destacado?: boolean;
}) {
  const st = STATUS_LABEL[p.status] ?? STATUS_LABEL.pausado;

  return (
    <div
      className={`rounded-xl border p-4 ${
        destacado
          ? "border-brand-500/30 bg-brand-500/5"
          : "border-white/10 bg-ink-700/40"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-fg-muted" />
            <span className="font-semibold text-fg">{p.nome}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${st.classes}`}
            >
              {st.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-fg-muted">
            {p.categoria} · {p.cidade}, {p.estado}
          </p>
          {p.descricao && (
            <p className="mt-2 line-clamp-2 text-xs text-fg-subtle">
              {p.descricao}
            </p>
          )}
          <p className="mt-1.5 text-[10px] text-fg-subtle">
            Criado em {new Date(p.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <Link
            href={`/prestadores/${p.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-fg-muted hover:border-white/20 hover:text-fg"
          >
            <ExternalLink className="h-3 w-3" />
            Ver
          </Link>

          {p.status === "pendente_aprovacao" && (
            <div className="flex gap-2">
              <form
                action={async () => {
                  "use server";
                  await aprovarPrestadorAction(p.id);
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
                  await rejeitarPrestadorAction(p.id);
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
    </div>
  );
}

function Empty({ mensagem }: { mensagem: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-ink-700/40 p-10 text-center text-sm text-fg-muted">
      {mensagem}
    </div>
  );
}
