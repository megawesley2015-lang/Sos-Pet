import Link from "next/link";
import { Eye, Plus } from "lucide-react";
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
const SPECIES_EMOJI: Record<string, string> = { dog: "🐕", cat: "🐈", other: "🐾" };

type Sighting = Awaited<ReturnType<typeof listarAvistamentosRecentes>>[number];
type SightingPet = { id: string; name: string | null; species: string; photo_url: string | null; city: string; neighborhood: string | null; kind: string; status: string } | null;

function SightingRow({ sighting }: { sighting: Sighting }) {
  const pet = sighting.pets as SightingPet;
  const speciesLabel = SPECIES_LABEL[pet?.species ?? "other"] ?? "Animal";
  const emoji = SPECIES_EMOJI[pet?.species ?? "other"];
  const displayName = pet?.name ?? speciesLabel;
  const isFound = pet?.kind === "found";
  const loc = sighting.address ?? [pet?.neighborhood, pet?.city].filter(Boolean).join(", ");

  return (
    <li className="relative flex gap-4">
      {/* Dot avatar na timeline */}
      <span
        className={`z-[1] flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 bg-bg-raised text-2xl shadow-card ${
          isFound ? "border-[#20B2AA]" : "border-brand-400"
        }`}
      >
        {emoji}
      </span>

      <div className="flex-1 rounded-2xl border border-border bg-bg-raised p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-px text-[10px] font-bold uppercase ${
              isFound
                ? "border-[#20B2AA]/40 bg-badge-found-bg text-badge-found-fg"
                : "border-[#FF9933]/40 bg-badge-lost-bg text-badge-lost-fg"
            }`}
          >
            {isFound ? "avistado" : "possível perdido"}
          </span>
          {sighting.reporter_name && (
            <span className="text-sm font-bold text-fg">{sighting.reporter_name}</span>
          )}
          <span className="ml-auto text-xs text-fg-subtle">{formatRelativeDate(sighting.created_at)}</span>
        </div>

        {sighting.description && (
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-fg-muted">{sighting.description}</p>
        )}

        {loc && (
          <p className="mt-2 text-[13px] font-semibold text-brand-text">
            <span aria-hidden="true">📍</span> {loc}
          </p>
        )}

        {pet && (
          <div className="mt-3 border-t border-border pt-3">
            <Link
              href={`/pets/${pet.id}`}
              className="text-[13px] text-fg-subtle transition-colors hover:text-brand-600"
            >
              🔗 Ver o alerta de {displayName} →
            </Link>
          </div>
        )}
      </div>
    </li>
  );
}

export default async function AvistamentosPage() {
  const avistamentos = await listarAvistamentosRecentes();

  return (
    <div className="min-h-screen bg-bg">
      <TopBar />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-fg sm:text-4xl">
              Avistamentos <span className="text-brand-500">recentes</span>
            </h1>
            <p className="mt-2 max-w-xl text-fg-muted">
              O que a comunidade está vendo pela Baixada agora. Viu um pet na rua? Registre — pode
              ser o reencontro de alguém.
            </p>
          </div>
          <Link
            href="/avistamentos/novo"
            className="flex shrink-0 items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            Registrar avistamento
          </Link>
        </div>

        {avistamentos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-warm-300 bg-warm-50 py-20 text-center">
            <Eye className="h-12 w-12 text-fg-subtle/40" strokeWidth={1} />
            <div>
              <p className="font-semibold text-fg">Nenhum avistamento nos últimos 30 dias</p>
              <p className="mt-1 text-sm text-fg-muted">Viu um pet perdido? Seja o primeiro a reportar.</p>
            </div>
            <Link href="/avistamentos/novo" className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white">
              Registrar avistamento
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Linha vertical da timeline */}
            <div className="absolute bottom-3 left-[27px] top-3 w-0.5 bg-border" aria-hidden="true" />
            <ul className="flex flex-col gap-5">
              {avistamentos.map((a) => (
                <SightingRow key={a.id} sighting={a} />
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
