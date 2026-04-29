import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  PawPrint,
  Pencil,
  Siren,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import type { PetRow } from "@/lib/types/database";
import { TopBar } from "@/components/layout/TopBar";
import { SOSBadge } from "@/components/ui/SOSBadge";
import { CTAButton } from "@/components/ui/CTAButton";
import SightingsList from "./SightingsList";
import {
  formatPhone,
  formatRelativeDate,
  whatsappLink,
  SPECIES_LABEL,
  SIZE_LABEL,
  SEX_LABEL,
  KIND_LABEL,
} from "@/lib/utils/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Metadata por pet — puxa nome/cidade pra title e description
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("pets")
    .select("name, kind, species, neighborhood, city")
    .eq("id", id)
    .maybeSingle();

  const pet = data as
    | {
        name: string | null;
        kind: "lost" | "found";
        species: string;
        neighborhood: string;
        city: string;
      }
    | null;

  if (!pet) {
    return { title: "Pet não encontrado" };
  }

  const verb = pet.kind === "lost" ? "Procura-se" : "Encontrado";
  const nome = pet.name ?? `${pet.species} ${pet.kind}`;
  return {
    title: `${verb}: ${nome} em ${pet.city}`,
    description: `${verb} ${nome} em ${pet.neighborhood}, ${pet.city}. Veja detalhes e ajude na rede SOS Pet.`,
  };
}

export default async function PetDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: petRaw, error } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  const pet = petRaw as PetRow | null;
  if (error || !pet) {
    notFound();
  }

  // Decide se o user logado é dono do registro (mostra botão Editar)
  const user = await getUserSafe(supabase);
  const isOwner = !!user && pet.owner_id === user.id;

  const waMessage = `Oi! Vi o registro do pet ${
    pet.name ? pet.name : `(${KIND_LABEL[pet.kind].toLowerCase()})`
  } no SOS Pet e gostaria de ajudar.`;

  return (
    <div className="min-h-screen bg-ink-800 bg-radial-brand">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/pets"
            className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a listagem
          </Link>
          {isOwner && (
            <div className="flex items-center gap-2">
              {pet.kind === "lost" && (
                <Link
                  href={`/resgate?pet=${pet.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-500/15 px-3 py-1.5 text-xs font-bold text-brand-200 shadow-glow-brand hover:bg-brand-500/25"
                >
                  <Siren className="h-3.5 w-3.5" />
                  Disparar SOS
                </Link>
              )}
              <Link
                href={`/pets/${pet.id}/editar`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-fg hover:bg-white/10"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Link>
            </div>
          )}
        </div>

        <article className="overflow-hidden rounded-2xl border border-white/10 bg-ink-700/80 backdrop-blur-sm">
          {/* Foto */}
          <div className="relative h-72 bg-gradient-to-br from-ink-600 to-ink-900 sm:h-96">
            {pet.photo_url ? (
              <Image
                src={pet.photo_url}
                alt={pet.name ?? "Pet"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <PawPrint className="h-20 w-20 text-brand-500/30" />
              </div>
            )}
            <div className="absolute left-3 top-3 z-10">
              <SOSBadge kind={pet.kind} />
            </div>
          </div>

          <div className="p-6">
            <h1 className="font-display text-3xl font-bold">
              {pet.name ?? "Sem nome"}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
              <MapPin className="h-4 w-4 text-brand-500" />
              {pet.neighborhood}, {pet.city}
              {pet.state && ` — ${pet.state}`}
            </p>
            <p className="mt-1 text-xs text-fg-subtle">
              {pet.kind === "lost" ? "Desaparecido" : "Encontrado"} em{" "}
              {new Date(pet.event_date).toLocaleDateString("pt-BR")} ·{" "}
              {formatRelativeDate(pet.created_at)}
            </p>

            {/* Atributos */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Attr label="Espécie" value={SPECIES_LABEL[pet.species]} />
              {pet.breed && <Attr label="Raça" value={pet.breed} />}
              <Attr label="Cor" value={pet.color} />
              {pet.size && <Attr label="Porte" value={SIZE_LABEL[pet.size]} />}
              {pet.sex && <Attr label="Sexo" value={SEX_LABEL[pet.sex]} />}
              {pet.age_approx && <Attr label="Idade" value={pet.age_approx} />}
            </div>

            {pet.description && (
              <section className="mt-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-fg-muted">
                  Descrição
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-fg">
                  {pet.description}
                </p>
              </section>
            )}

            {pet.behavior && (
              <section className="mt-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-fg-muted">
                  Comportamento
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-fg">
                  {pet.behavior}
                </p>
              </section>
            )}

            {/* Contato */}
            <section className="mt-8 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-cyan-300">
                Entre em contato
              </h2>
              <p className="mt-1 text-sm text-fg">
                {pet.contact_name} · {formatPhone(pet.contact_phone)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {pet.contact_whatsapp && (
                  <CTAButton
                    href={whatsappLink(pet.contact_phone, waMessage)}
                    variant="primary"
                    icon={<MessageCircle className="h-4 w-4" />}
                  >
                    WhatsApp
                  </CTAButton>
                )}
                <CTAButton
                  href={`tel:${pet.contact_phone}`}
                  variant="secondary"
                  icon={<Phone className="h-4 w-4" />}
                >
                  Ligar
                </CTAButton>
              </div>
            </section>

            {/* Avistamentos + Mapa — apenas para pets perdidos */}
            {pet.kind === "lost" && (
              <SightingsList
                petId={pet.id}
                petName={pet.name ?? "Pet"}
                petCity={pet.city}
              />
            )}
          </div>
        </article>
      </main>
    </div>
  );
}

function Attr({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-ink-800/50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-fg">{value}</p>
    </div>
  );
}
