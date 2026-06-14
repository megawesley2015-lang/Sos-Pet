import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PawPrint, CheckCircle2, MapPin } from "lucide-react";
import { createSupabaseServerClient, createServiceClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { SOSBadge } from "@/components/ui/SOSBadge";
import { formatRelativeDate, SPECIES_LABEL } from "@/lib/utils/format";
import type { PetRow, ProfileRow, PetKind } from "@/lib/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", id)
    .maybeSingle();

  if (!profile) return { title: "Perfil não encontrado" };

  const name = profile.full_name ?? "Tutor";
  return {
    title: `Perfil de ${name}`,
    description: `Veja os registros de pets de ${name} na rede Pet Aumigo.`,
  };
}

export default async function PerfilPage({ params }: PageProps) {
  const { id } = await params;

  // Busca paralela: profile (public) + pets ativos + count de resolvidos
  const supabase = await createSupabaseServerClient();
  const service = createServiceClient();

  const [profileRes, petsRes, resolvedRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, created_at")
      .eq("id", id)
      .maybeSingle(),

    // pets_public já filtra status=active e expõe owner_id
    supabase
      .from("pets_public")
      .select("*")
      .eq("owner_id", id)
      .order("created_at", { ascending: false })
      .limit(48),

    // Service role para contar resolvidos (pets não visíveis anonimamente)
    service
      .from("pets")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", id)
      .eq("status", "resolved"),
  ]);

  if (!profileRes.data) notFound();

  const profile = profileRes.data as Pick<ProfileRow, "id" | "full_name" | "avatar_url" | "created_at">;
  const pets = (petsRes.data ?? []) as PetRow[];
  const resolvedCount = resolvedRes.count ?? 0;

  const displayName = profile.full_name ?? "Tutor anônimo";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const memberSince = new Date(profile.created_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const lostCount = pets.filter((p) => p.kind === "lost").length;
  const foundCount = pets.filter((p) => p.kind === "found").length;

  return (
    <div className="min-h-screen bg-bg bg-radial-brand" data-theme="light">
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-8">

        {/* Header do perfil */}
        <div className="mb-8 flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile.avatar_url ? (
              <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-brand-500/50 shadow-glow-brand">
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-brand-500/40 bg-brand-500/10 text-2xl font-bold text-brand-300 shadow-glow-brand">
                {initials || <PawPrint className="h-10 w-10 text-brand-400" />}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left">
            <h1 className="font-display text-3xl font-black text-fg">
              {displayName}
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              Membro desde {memberSince}
            </p>

            {/* Stats */}
            <div className="mt-4 flex flex-wrap justify-center gap-4 sm:justify-start">
              <Stat value={lostCount} label="perdidos" color="text-brand-400" />
              <Stat value={foundCount} label="encontrados" color="text-brand-500" />
              {resolvedCount > 0 && (
                <Stat
                  value={resolvedCount}
                  label="reencontrados"
                  color="text-green-400"
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                />
              )}
            </div>
          </div>
        </div>

        {/* Pets ativos */}
        {pets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-warm-200 bg-warm-50 p-12 text-center shadow-warm-card">
            <PawPrint className="mx-auto mb-3 h-10 w-10 text-brand-500/30" />
            <p className="text-sm text-fg-muted">
              Este tutor não tem registros ativos no momento.
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-4 font-display text-lg font-bold text-fg">
              Registros ativos
              <span className="ml-2 text-sm font-normal text-fg-muted">
                ({pets.length})
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <ProfilePetCard key={pet.id} pet={pet} />
              ))}
            </div>
          </>
        )}

        {/* Disclaimer de contato */}
        <p className="mt-10 text-center text-xs text-fg-subtle">
          Para entrar em contato, acesse o registro do pet desejado.
        </p>
      </main>
    </div>
  );
}

// ── Componentes internos ────────────────────────────────────────

function Stat({
  value,
  label,
  color,
  icon,
}: {
  value: number;
  label: string;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-warm-200 bg-warm-100 px-3 py-1.5">
      {icon}
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <span className="text-xs text-fg-muted">{label}</span>
    </div>
  );
}

function ProfilePetCard({ pet }: { pet: PetRow }) {
  return (
    <Link
      href={`/pets/${pet.id}`}
      className="group overflow-hidden rounded-xl border border-warm-200 bg-white transition-all hover:border-brand-500/40 shadow-warm-card hover:shadow-warm-hover"
    >
      {/* Imagem */}
      <div className="relative h-36 bg-gradient-to-br from-ink-600 to-ink-900">
        {pet.photo_url ? (
          <Image
            src={pet.photo_url}
            alt={pet.name ?? "Pet"}
            fill
            sizes="(max-width: 640px) 100vw, 300px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PawPrint className="h-10 w-10 text-brand-500/30" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/60 via-transparent to-transparent" />
        <div className="absolute left-2 top-2">
          <SOSBadge kind={pet.kind as PetKind} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="truncate text-sm font-bold text-fg">
          {pet.name ?? "Sem nome"}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-fg-subtle">
          {SPECIES_LABEL[pet.species]}
        </p>
        <div className="mt-2 flex items-center gap-1 text-xs text-fg-muted">
          <MapPin className="h-3 w-3 text-brand-500" />
          <span className="truncate">
            {pet.neighborhood}, {pet.city}
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-fg-subtle">
          {formatRelativeDate(pet.event_date ?? '')}
        </p>
      </div>
    </Link>
  );
}
