import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft, PawPrint, Plus, Siren } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { CTAButton } from "@/components/ui/CTAButton";
import { RescueLauncher } from "@/components/rescue/RescueLauncher";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { listPets } from "@/lib/services/pets";
import { listAlertsByPet } from "@/lib/services/alerts";
import { formatRelativeDate } from "@/lib/utils/format";
import { getBaseUrl } from "@/lib/utils/url";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ pet?: string }>;
}

/**
 * /resgate — Central de Resgate.
 *
 * Caso A: ?pet=<id> → mostra o launcher do SOSButton pra esse pet específico.
 * Caso B: sem param  → mostra grid dos pets perdidos do user pra escolher.
 */
export default async function CentralDeResgatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    redirect("/login?next=/resgate");
  }

  const { pets } = await listPets({
    ownerId: user.id,
    kind: "lost",
    limit: 100,
  });

  // Caso A: pet específico selecionado
  if (params.pet) {
    const pet = pets.find((p) => p.id === params.pet);
    if (!pet) {
      // Pet não é dele ou não existe
      redirect("/resgate");
    }
    const alertHistory = await listAlertsByPet(pet.id);

    return (
      <div className="min-h-screen bg-ink-800 bg-radial-brand">
        <div className="bg-grid-subtle min-h-screen">
          <TopBar />

          <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
            <Link
              href="/resgate"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
            >
              <ArrowLeft className="h-4 w-4" />
              Outros pets
            </Link>

            <header className="mb-6">
              <h1 className="font-display text-3xl font-bold leading-tight">
                Disparar{" "}
                <span className="text-brand-500 glow-text-brand">SOS</span>
              </h1>
              <p className="mt-1 text-sm text-fg-muted">
                Vai gerar um card pra você compartilhar nas redes.
              </p>
            </header>

            {/* Resumo do pet escolhido */}
            <div className="mb-8 flex items-center gap-3 rounded-xl border border-white/10 bg-ink-700/70 p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-800">
                {pet.photo_url ? (
                  <Image
                    src={pet.photo_url}
                    alt={pet.name ?? "Pet"}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <PawPrint className="h-6 w-6 text-brand-500/40" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{pet.name ?? "Sem nome"}</p>
                <p className="truncate text-xs text-fg-muted">
                  {pet.neighborhood}, {pet.city}
                </p>
              </div>
              <Link
                href={`/pets/${pet.id}`}
                className="shrink-0 text-xs text-cyan-400 hover:text-cyan-300"
              >
                Ver detalhes →
              </Link>
            </div>

            <div className="rounded-2xl border border-brand-500/30 bg-ink-700/40 p-6 backdrop-blur-sm sm:p-10">
              <RescueLauncher pet={pet} appUrl={`${getBaseUrl()}/pets/${pet.id}`} />
            </div>

            {/* Histórico */}
            {alertHistory.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-fg-muted">
                  Alertas recentes deste pet
                </h2>
                <ul className="space-y-2">
                  {alertHistory.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 rounded-lg border border-white/5 bg-ink-700/40 p-3 text-xs"
                    >
                      <Siren className="h-4 w-4 text-brand-400" />
                      <span className="flex-1 text-fg-muted">
                        Disparado {formatRelativeDate(a.created_at)} — raio{" "}
                        {a.raio_km} km
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                          a.status === "ativo"
                            ? "bg-brand-500/15 text-brand-300"
                            : "bg-white/5 text-fg-subtle"
                        }`}
                      >
                        {a.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </main>
        </div>
      </div>
    );
  }

  // Caso B: lista pets perdidos pra escolher
  return (
    <div className="min-h-screen bg-ink-800 bg-radial-brand">
      <div className="bg-grid-subtle min-h-screen">
        <TopBar />

        <main className="mx-auto max-w-4xl px-4 pb-20 pt-6">
          <header className="mb-6">
            <h1 className="font-display text-3xl font-bold leading-tight">
              Central de{" "}
              <span className="text-brand-500 glow-text-brand">Resgate</span>
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              Escolha um pet perdido para disparar um SOS visual.
            </p>
          </header>

          {pets.length === 0 ? (
            <EmptyLost />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {pets.map((pet) => (
                <li key={pet.id}>
                  <Link
                    href={`/resgate?pet=${pet.id}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-700/70 p-3 transition-all hover:border-brand-500/50 hover:shadow-glow-brand"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-800">
                      {pet.photo_url ? (
                        <Image
                          src={pet.photo_url}
                          alt={pet.name ?? "Pet"}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <PawPrint className="h-6 w-6 text-brand-500/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">
                        {pet.name ?? "Sem nome"}
                      </p>
                      <p className="truncate text-xs text-fg-muted">
                        {pet.neighborhood}, {pet.city}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-fg-subtle">
                        Perdido {formatRelativeDate(pet.event_date)}
                      </p>
                    </div>
                    <Siren className="h-5 w-5 shrink-0 text-brand-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyLost() {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-ink-700/40 p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-500/40 bg-brand-500/10">
        <Siren className="h-7 w-7 text-brand-400" strokeWidth={2} />
      </div>
      <h2 className="font-display text-xl font-bold text-fg">
        Você não tem pets marcados como perdidos
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-fg-muted">
        Para disparar um SOS, primeiro cadastre o pet desaparecido.
      </p>
      <div className="mt-5">
        <CTAButton
          href="/pets/novo"
          variant="primary"
          icon={<Plus className="h-4 w-4" strokeWidth={3} />}
        >
          Cadastrar pet perdido
        </CTAButton>
      </div>
    </div>
  );
}
