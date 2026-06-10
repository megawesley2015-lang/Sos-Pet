import Link from "next/link";
import Image from "next/image";
import { Eye, MapPin, Plus, Clock } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { listarAvistamentosRecentes } from "./actions";
import { formatRelativeDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Avistamentos",
  description: "Veja os avistamentos recentes de pets perdidos reportados pela comunidade SOS Pet.",
  alternates: { canonical: "/avistamentos" },
  openGraph: { url: "/avistamentos", type: "website" as const },
};

const SPECIES_EMOJI: Record<string, string> = { dog: "🐶", cat: "🐱", other: "🐾" };

export default async function AvistamentosPage() {
  const avistamentos = await listarAvistamentosRecentes();

  return (
    <div className="min-h-screen bg-bg">
      <TopBar />

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-fg">
              Avistamentos
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              Registre onde viu um pet perdido — sem precisar de conta.
            </p>
          </div>
          <Link
            href="/avistamentos/novo"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow-brand transition hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            Reportar avistamento
          </Link>
        </div>

        {/* Banner informativo */}
        <div className="mb-6 rounded-xl border border-brand-200/60 bg-brand-500/5 px-4 py-3 text-sm text-brand-700">
          <Eye className="mb-1 h-4 w-4 inline mr-1.5" />
          Viu um pet perdido na rua?{" "}
          <Link href="/avistamentos/novo" className="font-bold underline underline-offset-2 hover:text-brand-600">
            Registre o avistamento
          </Link>{" "}
          e ajude o tutor a encontrá-lo. Não precisa de login.
        </div>

        {avistamentos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-warm-300 bg-warm-50 py-20 text-center">
            <Eye className="h-12 w-12 text-fg-subtle/40" strokeWidth={1} />
            <div>
              <p className="font-semibold text-fg">Nenhum avistamento nos últimos 30 dias</p>
              <p className="mt-1 text-sm text-fg-muted">
                Viu um pet perdido? Seja o primeiro a reportar.
              </p>
            </div>
            <Link
              href="/avistamentos/novo"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white"
            >
              Registrar avistamento
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {avistamentos.map((a) => {
              const pet = a.pets as { id: string; name: string | null; species: string; photo_url: string | null; city: string; neighborhood: string | null } | null;
              const emoji = SPECIES_EMOJI[pet?.species ?? "other"];

              return (
                <div
                  key={a.id}
                  className="flex gap-4 rounded-xl border border-white/5 bg-ink-700/50 p-4"
                >
                  {/* Avatar pet */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-600">
                    {pet?.photo_url ? (
                      <Image
                        src={pet.photo_url}
                        alt={pet.name ?? "Pet"}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">
                        {emoji}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-400">
                        👀 Avistado
                      </span>
                      {pet && (
                        <Link
                          href={`/pets/${pet.id}`}
                          className="text-sm font-semibold text-fg hover:text-brand-300"
                        >
                          {pet.name ?? "Pet sem nome"}
                        </Link>
                      )}
                    </div>

                    {a.description && (
                      <p className="mt-1 text-sm text-fg-muted line-clamp-2">{a.description}</p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-fg-subtle">
                      {a.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {a.address}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeDate(a.created_at)}
                      </span>
                      {a.reporter_name && (
                        <span className="text-fg-subtle">por {a.reporter_name}</span>
                      )}
                    </div>
                  </div>

                  {pet && (
                    <Link
                      href={`/pets/${pet.id}`}
                      className="shrink-0 self-center text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Ver pet →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
