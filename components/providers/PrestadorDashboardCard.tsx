import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  ExternalLink,
  Eye,
  MessageCircle,
  Pencil,
  Phone,
  Star,
} from "lucide-react";
import type { PrestadorRow, PrestadorStatsRow } from "@/lib/types/database";
import { CATEGORIA_LABEL } from "@/lib/services/providers";

interface Props {
  prestador: PrestadorRow;
  stats: PrestadorStatsRow | null;
}

/**
 * Card grande do dashboard — mostra o prestador + métricas + ações.
 */
export function PrestadorDashboardCard({ prestador, stats }: Props) {
  const v = stats?.visualizacoes ?? 0;
  const w = stats?.cliques_whatsapp ?? 0;
  const t = stats?.cliques_telefone ?? 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-ink-700/60 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-4 border-b border-white/5 p-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-ink-800">
          {prestador.logo_url ? (
            <Image
              src={prestador.logo_url}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 className="h-7 w-7 text-cyan-500/50" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-display text-base font-bold text-fg">
              {prestador.nome}
            </h2>
            {prestador.status !== "ativo" && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-fg-muted">
                {prestador.status}
              </span>
            )}
          </div>
          <p className="text-[11px] uppercase tracking-wide text-cyan-400">
            {CATEGORIA_LABEL[prestador.categoria]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/prestadores/${prestador.slug}`}
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver público
          </Link>
          <Link
            href={`/prestadores/${prestador.slug}/editar`}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-fg hover:bg-white/10"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <Metric
          icon={Eye}
          label="Visualizações"
          value={v}
          color="cyan"
        />
        <Metric
          icon={MessageCircle}
          label="Cliques WhatsApp"
          value={w}
          color="brand"
        />
        <Metric
          icon={Phone}
          label="Cliques telefone"
          value={t}
          color="cyan"
        />
        <Metric
          icon={Star}
          label="Avaliação"
          value={
            prestador.total_avaliacoes > 0
              ? prestador.media_avaliacoes.toFixed(1)
              : "—"
          }
          subValue={
            prestador.total_avaliacoes > 0
              ? `${prestador.total_avaliacoes} ${prestador.total_avaliacoes === 1 ? "review" : "reviews"}`
              : "sem reviews"
          }
          color="brand"
        />
      </div>
    </article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: typeof Eye;
  label: string;
  value: number | string;
  subValue?: string;
  color: "brand" | "cyan";
}) {
  const ring =
    color === "brand"
      ? "border-brand-500/30 bg-brand-500/5 text-brand-300"
      : "border-cyan-500/30 bg-cyan-500/5 text-cyan-300";
  return (
    <div className={`rounded-xl border ${ring} p-3`}>
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 opacity-70" />
        <p className="font-display text-xl font-bold text-fg">
          {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
        </p>
      </div>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-fg-subtle">
        {label}
      </p>
      {subValue && (
        <p className="mt-0.5 text-[10px] text-fg-muted">{subValue}</p>
      )}
    </div>
  );
}
