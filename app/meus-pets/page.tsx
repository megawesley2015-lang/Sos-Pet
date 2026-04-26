import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, PawPrint } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { PetGrid } from "@/components/pets/PetGrid";
import { CTAButton } from "@/components/ui/CTAButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { listPets } from "@/lib/services/pets";

export const dynamic = "force-dynamic";

/**
 * /meus-pets — registros do user logado.
 *
 * Mostra todos os status (active + resolved + removed) — dono vê tudo dele.
 * Middleware já bloqueia acesso anônimo, mas re-checamos por defesa em profundidade.
 */
export default async function MeusPetsPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    redirect("/login?next=/meus-pets");
  }

  const { pets, error } = await listPets({ ownerId: user.id, limit: 100 });

  return (
    <div className="min-h-screen bg-ink-800 bg-radial-brand">
      <div className="bg-grid-subtle min-h-screen">
        <TopBar />

        <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight">
                Meus{" "}
                <span className="text-brand-500 glow-text-brand">pets</span>
              </h1>
              <p className="mt-1 text-sm text-fg-muted">
                {pets.length === 0
                  ? "Você ainda não cadastrou nenhum registro."
                  : `${pets.length} ${
                      pets.length === 1 ? "registro" : "registros"
                    } sob sua gestão.`}
              </p>
            </div>

            <CTAButton
              href="/pets/novo"
              variant="primary"
              icon={<Plus className="h-4 w-4" strokeWidth={3} />}
            >
              Novo registro
            </CTAButton>
          </header>

          {error ? (
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger-fg">
              <p className="font-bold">Erro ao carregar seus pets</p>
              <p className="mt-1 text-xs opacity-80">{error}</p>
            </div>
          ) : pets.length === 0 ? (
            <EmptyState />
          ) : (
            <PetGrid pets={pets} />
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-ink-700/40 p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-500/40 bg-brand-500/10">
        <PawPrint className="h-7 w-7 text-brand-400" strokeWidth={2} />
      </div>
      <h2 className="font-display text-xl font-bold text-fg">
        Nenhum registro ainda
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-fg-muted">
        Cadastre um pet perdido ou encontrado para acompanhar aqui no seu
        painel.
      </p>
      <div className="mt-5">
        <CTAButton
          href="/pets/novo"
          variant="primary"
          icon={<Plus className="h-4 w-4" strokeWidth={3} />}
        >
          Cadastrar primeiro pet
        </CTAButton>
      </div>
      <Link
        href="/pets"
        className="mt-3 inline-block text-xs text-fg-subtle hover:text-fg-muted"
      >
        ou navegue pela rede
      </Link>
    </div>
  );
}
