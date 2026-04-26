import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  MapPin,
  ShieldCheck,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import type { PrestadorRow } from "@/lib/types/database";
import { CATEGORIA_LABEL } from "@/lib/services/providers";

interface PrestadorCardProps {
  prestador: PrestadorRow;
}

export function PrestadorCard({ prestador }: PrestadorCardProps) {
  return (
    <Link
      href={`/prestadores/${prestador.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-ink-700/70 backdrop-blur-sm transition-all hover:border-cyan-500/40 hover:shadow-glow-cyan"
    >
      {/* Capa + logo */}
      <div className="relative h-32 bg-gradient-to-br from-ink-600 to-ink-900">
        {prestador.capa_url ? (
          <Image
            src={prestador.capa_url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 350px"
            className="object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 bg-grid-subtle opacity-50" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-700/80 to-transparent" />

        {/* Badges no topo */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {prestador.verificado && (
            <span
              title="Prestador verificado"
              className="flex items-center gap-1 rounded-full bg-cyan-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-900 shadow-glow-cyan"
            >
              <ShieldCheck className="h-3 w-3" />
              Verificado
            </span>
          )}
          {prestador.destaque && (
            <span className="rounded-full bg-brand-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-glow-brand">
              Destaque
            </span>
          )}
        </div>

        {/* Logo */}
        <div className="absolute -bottom-6 left-3 h-12 w-12 overflow-hidden rounded-xl border-2 border-ink-700 bg-ink-800">
          {prestador.logo_url ? (
            <Image
              src={prestador.logo_url}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 className="h-6 w-6 text-cyan-500/50" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-3 pt-8">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-display text-sm font-bold text-fg">
            {prestador.nome}
          </h3>
          {prestador.total_avaliacoes > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-fg-muted">
              <Star className="h-3 w-3 fill-brand-500 text-brand-500" />
              {prestador.media_avaliacoes.toFixed(1)}
              <span className="text-fg-subtle">
                ({prestador.total_avaliacoes})
              </span>
            </span>
          )}
        </div>

        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-cyan-400">
          {CATEGORIA_LABEL[prestador.categoria]}
        </p>

        <p className="mt-2 flex items-center gap-1 text-xs text-fg-muted">
          <MapPin className="h-3 w-3 text-brand-500" />
          <span className="truncate">
            {prestador.bairro ? `${prestador.bairro}, ` : ""}
            {prestador.cidade}
          </span>
        </p>

        {/* Flags rápidos */}
        {(prestador.emergencia24h || prestador.delivery) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {prestador.emergencia24h && (
              <Flag icon={Zap} label="24h" color="brand" />
            )}
            {prestador.delivery && (
              <Flag icon={Truck} label="Delivery" color="cyan" />
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function Flag({
  icon: Icon,
  label,
  color,
}: {
  icon: typeof Zap;
  label: string;
  color: "brand" | "cyan";
}) {
  const cls =
    color === "brand"
      ? "border-brand-500/40 bg-brand-500/10 text-brand-300"
      : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
