import { Suspense } from "react";
import { Plus, Radar } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { PetFilters } from "@/components/pets/PetFilters";
import { PetGrid } from "@/components/pets/PetGrid";
import { CTAButton } from "@/components/ui/CTAButton";
import type { PetKind, PetSpecies } from "@/lib/types/database";

/**
 * LISTAGEM PÚBLICA DE PETS
 *
 * Server Component — consulta o Supabase direto (SSR), sem fetch.
 * Lê filtros da URL (?kind=lost&species=dog&city=...).
 *
 * RLS: policy "pets_select_active" permite acesso anônimo a pets ativos.
 */

// Evita cache estático — queremos sempre dados frescos no MVP
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    kind?: string;
    species?: string;
    city?: string;
  }>;
}

export default async function PetsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  // Constrói a query respeitando filtros
  let query = supabase
    .from("pets")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(48);

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

  const { data: pets, error } = await query;

  return (
    <div className="min-h-screen bg-ink-800 bg-radial-brand">
      <div className="bg-grid-subtle min-h-screen">
        <TopBar />

        <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
          {/* Hero */}
          <section className="mb-6 animate-fade-in">
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              Achados &amp;{" "}
              <span className="text-brand-500 glow-text-brand">Perdidos</span>
            </h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-fg-muted">
              <Radar className="h-4 w-4 text-cyan-400" strokeWidth={2} />
              <span>
                {pets?.length ?? 0} pets ativos{" "}
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
              <PetGrid pets={pets ?? []} />
            )}
          </section>
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
