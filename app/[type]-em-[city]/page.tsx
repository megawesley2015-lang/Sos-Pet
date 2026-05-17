/**
 * /achados-em-[city] e /perdidos-em-[city]
 *
 * Página dinâmica otimizada para SEO local.
 * Mostra todos os pets (achados ou perdidos) de uma cidade específica.
 *
 * Route: /achados-em-[city] ou /perdidos-em-[city]
 * Exemplo: /achados-em-sao-paulo, /perdidos-em-curitiba
 */

import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { PetGrid } from "@/components/pets/PetGrid";
import { listPets } from "@/lib/services/pets";
import { slugToCity } from "@/lib/utils/string";
import type { PetKind } from "@/lib/types/database";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    type: "achados" | "perdidos";
    city: string;
  }>;
}

// ─── Metadata ────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { type, city } = await params;
  const realCity = slugToCity(city);
  const isFound = type === "achados";
  const typeLabel = isFound ? "Achados" : "Perdidos";
  const emoji = isFound ? "🐾" : "❤️";

  return {
    title: `${emoji} ${typeLabel} em ${realCity} — SOS Pet`,
    description: `Todos os pets ${isFound ? "encontrados" : "perdidos"} em ${realCity}. Ajude a reunir animais com suas famílias ou compartilhe informações sobre achados.`,
    openGraph: {
      title: `${typeLabel} em ${realCity} — SOS Pet`,
      description: `${typeLabel} de pets em ${realCity}. Reencontre seu pet ou ajude na busca.`,
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// ─── Page Component ──────────────────────────────────────────

export default async function LocalPetsPage({ params }: PageProps) {
  const { type, city } = await params;
  const realCity = slugToCity(city);
  const isFound = type === "achados";
  const kind: PetKind = isFound ? "found" : "lost";
  const typeLabel = isFound ? "Achados" : "Perdidos";
  const emoji = isFound ? "🐾" : "❤️";

  // Busca pets da cidade
  const { pets, error } = await listPets({
    city: realCity,
    kind,
    limit: 100,
  });

  return (
    <div className="min-h-screen bg-ink-800">
      <TopBar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        {/* Breadcrumb */}
        <Link
          href="/pets"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para todos os pets
        </Link>

        {/* Header */}
        <header className="mb-8">
          <h1 className="font-display text-4xl font-bold">
            {emoji} {typeLabel} em <span className="text-brand-500">{realCity}</span>
          </h1>
          <p className="mt-2 text-lg text-fg-muted">
            {isFound
              ? `${pets.length} pet${pets.length !== 1 ? "s" : ""} encontrado${pets.length !== 1 ? "s" : ""} aguardando reencontro`
              : `${pets.length} pet${pets.length !== 1 ? "s" : ""} desaparecido${pets.length !== 1 ? "s" : ""} — ajude na busca`}
          </p>

          {/* Quick Links */}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/achados-em-${city}`}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isFound
                  ? "bg-brand-500 text-white"
                  : "border border-white/20 text-fg hover:bg-white/5"
              }`}
            >
              🐾 Achados
            </Link>
            <Link
              href={`/perdidos-em-${city}`}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                !isFound
                  ? "bg-brand-500 text-white"
                  : "border border-white/20 text-fg hover:bg-white/5"
              }`}
            >
              ❤️ Perdidos
            </Link>
          </div>
        </header>

        {/* Conteúdo */}
        {error ? (
          <div className="rounded-xl border border-danger-fg/30 bg-danger-fg/5 p-6 text-center text-danger-fg">
            Erro ao carregar pets. Tente novamente.
          </div>
        ) : pets.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="mb-4 text-fg-muted">
              Nenhum pet {isFound ? "encontrado" : "perdido"} em {realCity} no momento.
            </p>
            <Link
              href="/pets/novo"
              className="inline-block rounded-lg bg-brand-500 px-6 py-2 font-medium text-white transition-colors hover:bg-brand-600"
            >
              Cadastrar um pet
            </Link>
          </div>
        ) : (
          <>
            <PetGrid pets={pets} />

            {/* SEO Footer */}
            <section className="mt-16 rounded-xl border border-white/10 bg-white/5 p-8">
              <h2 className="mb-4 font-display text-2xl font-bold">
                Sobre pets em {realCity}
              </h2>
              <p className="mb-4 text-fg-muted">
                O SOS Pet é uma rede colaborativa que ajuda a reunir pets perdidos com suas famílias.
                Se você {isFound ? "encontrou" : "perdeu"} um pet em {realCity}, registre aqui para
                aumentar as chances de reencontro.
              </p>
              <p className="text-sm text-fg-muted">
                ℹ️ Dica: quanto mais detalhes você fornecer (cor, raça, características distintivas),
                mais rápido o reencontro será.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
