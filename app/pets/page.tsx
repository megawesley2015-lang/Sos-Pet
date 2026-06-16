import { Suspense } from "react";
import Link from "next/link";
import { Plus, Radar, ChevronLeft, ChevronRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { PetFilters } from "@/components/pets/PetFilters";
import { PetGrid } from "@/components/pets/PetGrid";
import { CTAButton } from "@/components/ui/CTAButton";
import type { Metadata } from "next";
import type { PetKind, PetSpecies, PetRow } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Achados & Perdidos",
  description:
    "Veja todos os pets perdidos e encontrados cadastrados na rede SOS Pet Aumigo. Filtre por espécie, tipo e cidade.",
  alternates: { canonical: "/pets" },
  openGraph: {
    title: "Achados & Perdidos · SOS Pet Aumigo",
    description: "Pets perdidos e encontrados na sua região. Ajude a reencontrar quem se perdeu.",
    url: "/pets",
    type: "website",
  },
};

/**
 * LISTAGEM PÚBLICA DE PETS
 *
 * Server Component — consulta o Supabase direto (SSR), sem fetch.
 * Lê filtros da URL (?kind=lost&species=dog&city=...&page=N).
 *
 * Paginação: offset-based via range(). Cada página mostra PAGE_SIZE pets.
 * A view pets_public já filtra status='active' — anônimos enxergam normalmente.
 */

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

interface PageProps {
  searchParams: Promise<{
    kind?: string;
    species?: string;
    city?: string;
    page?: string;
  }>;
}

export default async function PetsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // IMPORTANTE: usa a view pets_public (não a tabela pets) para que
  // visitantes não autenticados possam ver a listagem.
  // count: "exact" retorna o total para calcular paginação.
  let query = supabase
    .from("pets_public")
    .select(
      "id, name, species, kind, status, city, photo_url, created_at, breed, color, neighborhood",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.kind === "lost" || params.kind === "found") {
    query = query.eq("kind", params.kind as PetKind);
  }
  if (
    params.species === "dog" ||
    params.species === "cat" ||
    params.species === "other"
  ) {
    query = query.eq("species", params.species as PetSpecies);
  }
  if (params.city) {
    query = query.ilike("city", `%${params.city}%`);
  }

  const { data: pets, count, error } = await query;

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  // Monta a query string preservando os filtros ao paginar
  function buildPageUrl(targetPage: number) {
    const qs = new URLSearchParams();
    if (params.kind) qs.set("kind", params.kind);
    if (params.species) qs.set("species", params.species);
    if (params.city) qs.set("city", params.city);
    if (targetPage > 1) qs.set("page", String(targetPage));
    const s = qs.toString();
    return `/pets${s ? `?${s}` : ""}`;
  }

  return (
    <div data-theme="light" className="min-h-screen bg-bg">
      <div className="min-h-screen">
        <TopBar />

        <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
          {/* Hero */}
          <section className="mb-6 animate-fade-in">
            <h1 className="font-display text-3xl font-bold leading-tight text-fg sm:text-4xl">
              Achados &amp;{" "}
              <span className="text-brand-500">Perdidos</span>
            </h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-fg-muted">
              <Radar className="h-4 w-4 text-brand-500" strokeWidth={2} />
              <span>
                {count ?? 0} pets ativos{" "}
                {params.city ? `em ${params.city}` : "na rede"} agora
              </span>
            </p>
          </section>

          {/* Filtros */}
          <section className="mb-6">
            <Suspense fallback={<div className="h-16" />}>
              <PetFilters />
            </Suspense>
          </section>

          {/* Grid de pets */}
          <section>
            {error ? (
              <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger-fg">
                <p className="font-bold">Erro ao carregar pets</p>
                <p className="mt-1 text-xs opacity-80">{error.message}</p>
                <p className="mt-2 text-xs text-fg-muted">
                  Verifique se as variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
                  <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> estão no{" "}
                  <code>.env.local</code> e se o schema SQL foi aplicado.
                </p>
              </div>
            ) : (
              <PetGrid pets={(pets ?? []) as unknown as PetRow[]} />
            )}
          </section>

          {/* Paginação */}
          {totalPages > 1 && (
            <nav
              aria-label="Paginação"
              className="mt-10 flex items-center justify-center gap-3"
            >
              {hasPrev ? (
                <Link
                  href={buildPageUrl(page - 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-warm-200 bg-white px-4 py-2 text-sm font-medium text-fg-muted shadow-warm-card transition-colors hover:bg-warm-50 hover:text-fg"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Link>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-warm-100 px-4 py-2 text-sm text-fg-subtle opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </span>
              )}

              <span className="text-sm text-fg-muted">
                Página{" "}
                <strong className="text-fg">{page}</strong>{" "}
                de{" "}
                <strong className="text-fg">{totalPages}</strong>
              </span>

              {hasNext ? (
                <Link
                  href={buildPageUrl(page + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-warm-200 bg-white px-4 py-2 text-sm font-medium text-fg-muted shadow-warm-card transition-colors hover:bg-warm-50 hover:text-fg"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-warm-100 px-4 py-2 text-sm text-fg-subtle opacity-40">
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </nav>
          )}
        </main>

        {/* CTA flutuante */}
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
          <CTAButton
            href="/pets/novo"
            variant="primary"
            icon={<Plus className="h-4 w-4" strokeWidth={3} />}
          >
            Registrar Pet
          </CTAButton>
        </div>
      </div>
    </div>
  );
}
