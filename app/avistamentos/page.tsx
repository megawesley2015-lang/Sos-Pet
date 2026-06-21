import Link from "next/link";
import Image from "next/image";
import { Eye, MapPin, Plus, Clock } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { listarAvistamentosRecentes } from "./actions";
import { formatRelativeDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Avistamentos",
  description: "Veja os avistamentos recentes de pets perdidos reportados pela comunidade SOS Pet Aumigo.",
  alternates: { canonical: "/avistamentos" },
  openGraph: { url: "/avistamentos", type: "website" as const },
};

const SPECIES_LABEL: Record<string, string> = { dog: "Cachorro", cat: "Gato", other: "Animal" };
const SPECIES_EMOJI: Record<string, string> = { dog: "🐶", cat: "🐱", other: "🐾" };

type Sighting = Awaited<ReturnType<typeof listarAvistamentosRecentes>>[number];
type SightingPet = { id: string; name: string | null; species: string; photo_url: string | null; city: string; neighborhood: string | null; kind: string; status: string } | null;

function SightingCard({ sighting }: { sighting: Sighting }) {
  const pet = sighting.pets as SightingPet;
  const speciesLabel = SPECIES_LABEL[pet?.species ?? "other"] ?? "Animal";
  const emoji = SPECIES_EMOJI[pet?.species ?? "other"];
  const displayName = pet?.name ?? speciesLabel;
  const href = pet ? `/achados-e-perdidos/${pet.id}` : "#";

  return (
    <article className="group flex flex-col rounded-xl overflow-hidden border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-raised))] hover:border-[rgb(var(--color-border-strong))] hover:shadow-lg hover:shadow-black/20 transition-[border-color,box-shadow] duration-200">
      <Link href={href} className="flex flex-col" aria-label={`Avistamento de ${displayName}`}>
        {/* Foto do pet */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[rgb(var(--color-bg-overlay))]">
          {pet?.photo_url ? (
            <Image
              src={pet.photo_url}
              alt={`Foto de ${displayName}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden="true">
              {emoji}
            </div>
          )}

          {/* Badge avistamento */}
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-300 backdrop-blur-sm">
              <Eye className="h-3 w-3" />
              Avistado
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 p-4">
          <p className="text-sm font-bold text-[rgb(var(--color-fg))] leading-tight">
            {displayName}
            <span className="ml-1 font-normal text-[rgb(var(--color-fg-muted))]">· {speciesLabel}</span>
          </p>

          {sighting.description && (
            <p className="text-xs text-[rgb(var(--color-fg-muted))] line-clamp-2 leading-relaxed">
              {sighting.description}
            </p>
          )}

          <div className="flex items-center gap-1 text-xs text-[rgb(var(--color-fg-subtle))]">
            <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">
              {sighting.address ?? [pet?.neighborhood, pet?.city].filter(Boolean).join(", ")}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-[rgb(var(--color-fg-subtle))]">
              <Clock className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              <span>{formatRelativeDate(sighting.created_at)}</span>
            </div>
            {sighting.reporter_name && (
              <span className="text-[10px] text-[rgb(var(--color-fg-subtle))] truncate max-w-[120px]">
                por {sighting.reporter_name}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default async function AvistamentosPage() {
  const avistamentos = await listarAvistamentosRecentes();

  return (
    <div className="min-h-screen bg-bg">
      <TopBar />

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-fg">Avistamentos</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Pets perdidos vistos pela comunidade nos últimos 30 dias.
            </p>
          </div>
          <Link
            href="/avistamentos/novo"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow-brand transition hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            Reportar
          </Link>
        </div>

        {avistamentos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-warm-300 bg-warm-50 py-20 text-center">
            <Eye className="h-12 w-12 text-fg-subtle/40" strokeWidth={1} />
            <div>
              <p className="font-semibold text-fg">Nenhum avistamento nos últimos 30 dias</p>
              <p className="mt-1 text-sm text-fg-muted">Viu um pet perdido? Seja o primeiro a reportar.</p>
            </div>
            <Link href="/avistamentos/novo" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white">
              Registrar avistamento
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {avistamentos.map((a) => (
              <SightingCard key={a.id} sighting={a} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
