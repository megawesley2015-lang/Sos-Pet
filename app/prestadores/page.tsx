import { Suspense } from "react";
import Link from "next/link";
import { Building2, Plus, Stethoscope } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { CTAButton } from "@/components/ui/CTAButton";
import { PrestadorCard } from "@/components/providers/PrestadorCard";
import { PrestadorFilters } from "@/components/providers/PrestadorFilters";
import { listProviders } from "@/lib/services/providers";
import type { PrestadorCategoria } from "@/lib/types/database";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    categoria?: string;
    busca?: string;
    cidade?: string;
    emergencia24h?: string;
    delivery?: string;
  }>;
}

const VALID_CATEGORIAS: PrestadorCategoria[] = [
  "veterinario",
  "petshop",
  "adestrador",
  "hospedagem",
  "banho_tosa",
  "outro",
];

export default async function PrestadoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categoria = VALID_CATEGORIAS.includes(
    params.categoria as PrestadorCategoria
  )
    ? (params.categoria as PrestadorCategoria)
    : undefined;

  const { providers, error } = await listProviders({
    categoria,
    busca: params.busca,
    cidade: params.cidade,
    emergencia24h: params.emergencia24h === "1",
    delivery: params.delivery === "1",
  });

  return (
    <div className="min-h-screen bg-ink-800 bg-radial-brand">
      <div className="bg-grid-subtle min-h-screen">
        <TopBar />

        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
          {/* Hero */}
          <section className="mb-6">
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              Prestadores{" "}
              <span className="text-cyan-400 glow-text-brand">parceiros</span>
            </h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-fg-muted">
              <Stethoscope className="h-4 w-4 text-cyan-400" strokeWidth={2} />
              <span>
                {providers.length}{" "}
                {providers.length === 1 ? "prestador" : "prestadores"} ativos na rede
              </span>
            </p>
          </section>

          {/* Filtros */}
          <section className="mb-6">
            <Suspense fallback={<div className="h-32" />}>
              <PrestadorFilters />
            </Suspense>
          </section>

          {/* Grid */}
          <section>
            {error ? (
              <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger-fg">
                <p className="font-bold">Erro ao carregar prestadores</p>
                <p className="mt-1 text-xs opacity-80">{error}</p>
              </div>
            ) : providers.length === 0 ? (
              <Empty />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {providers.map((p) => (
                  <li key={p.id}>
                    <PrestadorCard prestador={p} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>

        {/* CTA flutuante */}
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
          <CTAButton
            href="/prestadores/novo"
            variant="secondary"
            icon={<Plus className="h-4 w-4" strokeWidth={3} />}
          >
            Sou prestador
          </CTAButton>
        </div>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-ink-700/40 p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-500/40 bg-cyan-500/10">
        <Building2 className="h-7 w-7 text-cyan-400" strokeWidth={2} />
      </div>
      <h2 className="font-display text-xl font-bold text-fg">
        Nenhum prestador no filtro atual
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-fg-muted">
        Tente abrir os filtros, mudar de cidade — ou seja você o primeiro a se
        cadastrar.
      </p>
      <div className="mt-5">
        <Link
          href="/prestadores"
          className="text-xs text-cyan-400 hover:text-cyan-300"
        >
          ← Limpar filtros
        </Link>
      </div>
    </div>
  );
}
