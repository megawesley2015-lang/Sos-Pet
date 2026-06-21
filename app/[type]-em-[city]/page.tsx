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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugToCity } from "@/lib/utils/string";
import { breadcrumbJsonLd } from "@/lib/utils/jsonld";
import { safeJsonLd } from "@/lib/utils/json-ld";
import { getBaseUrl } from "@/lib/utils/url";
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
  const kind: PetKind = isFound ? "found" : "lost";

  // Contagem dinâmica para meta description — melhora CTR na SERP
  let count = 0;
  try {
    const supabase = await createSupabaseServerClient();
    const { count: n } = await supabase
      .from("pets")
      .select("*", { count: "exact", head: true })
      .eq("kind", kind)
      .eq("status", "active")
      .ilike("city", realCity);
    count = n ?? 0;
  } catch {
    // fallback silencioso — description genérica se DB offline
  }

  const countText = count > 0
    ? `${count} pet${count !== 1 ? "s" : ""} ${isFound ? "encontrado" : "perdido"}${count !== 1 ? "s" : ""} em ${realCity} agora.`
    : `Pets ${isFound ? "encontrados" : "perdidos"} em ${realCity}.`;

  return {
    title: `${emoji} ${typeLabel} em ${realCity}`,
    description: `${countText} Ajude a reunir animais com suas famílias ou cadastre um avistamento.`,
    alternates: { canonical: `/${type}-em-${city}` },
    openGraph: {
      title: `${typeLabel} em ${realCity} — SOS Pet Aumigo`,
      description: `${countText} Reencontre seu pet ou ajude na busca.`,
      type: "website",
    },
    robots: { index: true, follow: true },
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

  const baseUrl = getBaseUrl();
  const breadcrumb = breadcrumbJsonLd([
    { name: "Início", url: baseUrl },
    { name: "Pets", url: `${baseUrl}/pets` },
    { name: `${typeLabel} em ${realCity}`, url: `${baseUrl}/${type}-em-${city}` },
  ]);

  return (
    <div className="min-h-screen bg-bg" data-theme="light">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }} />
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
                  : "border border-warm-200 bg-white text-fg hover:bg-warm-50"
              }`}
            >
              🐾 Achados
            </Link>
            <Link
              href={`/perdidos-em-${city}`}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                !isFound
                  ? "bg-brand-500 text-white"
                  : "border border-warm-200 bg-white text-fg hover:bg-warm-50"
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
          <div className="rounded-xl border border-warm-200 bg-white p-8 text-center shadow-warm-card">
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
            <section className="mt-16 rounded-xl border border-warm-200 bg-white p-8 shadow-warm-card">
              <h2 className="mb-4 font-display text-2xl font-bold">
                Sobre pets em {realCity}
              </h2>
              <p className="mb-4 text-fg-muted">
                O SOS Pet Aumigo é uma rede colaborativa que ajuda a reunir pets perdidos com suas famílias.
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
