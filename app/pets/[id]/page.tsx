import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft, MapPin, Phone, MessageCircle, PawPrint, Pencil, Siren } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { getPetById } from "@/lib/services/pets";
import { checkRateLimit } from "@/lib/rate-limit";
import type { PetSaudeRow, PetKind } from "@/lib/types/database";
import { TopBar } from "@/components/layout/TopBar";
import { SOSBadge } from "@/components/ui/SOSBadge";

import { PetDetailMapClient } from "./PetDetailMapClient";
import { CTAButton } from "@/components/ui/CTAButton";
import SightingsList from "./SightingsList";
import { ResolveButton, ReactivateButton } from "./ResolveButton";
import { HealthTimeline } from "@/components/pets/HealthTimeline";
import { MatchPanel } from "@/components/pets/MatchPanel";
import { listHealthRecords } from "@/lib/services/health";
import { EmergencySafetyBanner } from "@/components/store/EmergencySafetyBanner";
import { safeJsonLd } from "@/lib/utils/json-ld";
import {
  formatPhone,
  formatRelativeDate,
  whatsappLink,
  SPECIES_LABEL,
  SIZE_LABEL,
  SEX_LABEL,
  KIND_LABEL,
} from "@/lib/utils/format";
import { getBaseUrl } from "@/lib/utils/url";
import { petArticleJsonLd } from "@/lib/utils/jsonld";
import { CopyUrlButton } from "@/components/ui/CopyUrlButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ novo?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPetById(id);
  if (!pet) return { title: "Pet não encontrado" };

  const verb = pet.kind === "lost" ? "Procura-se" : "Encontrado";
  const nome = pet.name ?? `${pet.species} ${pet.kind}`;
  const title = `${verb}: ${nome} em ${pet.city}`;
  const description = `${verb} ${nome} em ${pet.neighborhood}, ${pet.city}. Veja detalhes e ajude na rede SOS Pet Aumigo.`;
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/pets/${id}`;
  const images = pet.photo_url ? [{ url: pet.photo_url, alt: nome }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", locale: "pt_BR", siteName: "SOS Pet Aumigo", images },
    twitter: {
      card: pet.photo_url ? "summary_large_image" : "summary",
      title,
      description,
      images: pet.photo_url ? [pet.photo_url] : undefined,
    },
  };
}

export default async function PetDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = sp.novo === "true";

  // Rate limit para a página de detalhe — 10 visitas por hora por IP.
  // Protege a RPC get_pet_contact chamada internamente por getPetById.
  const hdrs = await headers();
  const ip =
    hdrs.get("x-vercel-forwarded-for") ??
    hdrs.get("x-real-ip") ??
    "unknown";
  const rl = await checkRateLimit(`pet_detail:${ip}`, { limit: 10, windowMs: 3_600_000 });
  if (!rl.allowed) notFound();

  const supabase = await createSupabaseServerClient();

  const [pet, user] = await Promise.all([
    getPetById(id),
    getUserSafe(supabase),
  ]);

  const isOwner = !!user && !!pet && pet.owner_id === user.id;

  // Pets removidos: ninguém vê (nem o dono)
  if (!pet || pet.status === "removed") notFound();
  // Pets resolvidos: só o dono vê (página especial abaixo)
  if (pet.status !== "active" && !isOwner) notFound();

  const waMessage = `Oi! Vi o registro do pet ${
    pet.name ? pet.name : `(${KIND_LABEL[pet.kind].toLowerCase()})`
  } no SOS Pet Aumigo e gostaria de ajudar.`;

  // Busca paralela: health records (owner), sightings (pet lost) e perfil público do owner
  const hasLocation = !!pet.latitude && !!pet.longitude;

  const [healthResult, sightingsResult, ownerProfileResult] = await Promise.all([
    isOwner ? listHealthRecords(pet.id) : Promise.resolve({ records: [] }),
    pet.kind === "lost" && hasLocation
      ? supabase
          .from("sightings")
          .select("lat, lng, description, created_at")
          .eq("pet_id", pet.id)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: null }),
    pet.owner_id
      ? supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", pet.owner_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const healthRecords: PetSaudeRow[] = healthResult.records ?? [];
  const mapSightings: Array<{ lat: number; lng: number; description: string | null; created_at: string }> =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sightingsResult.data ?? []).map((s: any) => ({
      lat: s.lat, lng: s.lng, description: s.description, created_at: s.created_at,
    }));
  const ownerProfile = ownerProfileResult.data as
    | { id: string; full_name: string | null; avatar_url: string | null }
    | null;

  // ── Pet resolvido: owner vê tela de celebração ──────────────
  if (pet.status === "resolved") {
    return (
      <div className="min-h-screen bg-bg" data-theme="light">
        <TopBar />
        <main className="mx-auto max-w-2xl px-4 pb-16 pt-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-500/60 bg-green-500/10 text-5xl shadow-[0_0_24px_rgba(34,197,94,0.3)]">
            🎉
          </div>
          <h1 className="font-display text-4xl font-black text-fg">
            {pet.kind === "lost" ? "Que alegria!" : "Missão cumprida!"}
          </h1>
          <p className="mt-3 text-base text-fg-muted">
            {pet.kind === "lost"
              ? `${pet.name ? `${pet.name} voltou` : "Seu pet voltou"} para casa. Este registro foi marcado como resolvido e removido da listagem pública.`
              : `${pet.name ? `${pet.name} foi devolvido` : "O pet foi devolvido"} ao tutor. Ótimo trabalho!`}
          </p>

          <div className="mt-6 rounded-2xl border border-warm-200 bg-white p-5 text-left shadow-warm-card transition-shadow">
            <p className="text-xs font-bold uppercase tracking-wide text-fg-subtle">Registro</p>
            <p className="mt-1 text-sm font-medium text-fg">
              {pet.name ?? "Sem nome"} · {SPECIES_LABEL[pet.species]}
            </p>
            <p className="mt-1 text-xs text-fg-muted">
              {pet.neighborhood}, {pet.city} · {pet.event_date ? new Date(pet.event_date).toLocaleDateString("pt-BR") : ''}
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/meus-pets"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-400"
            >
              Ver meus registros
            </Link>
            <ReactivateButton petId={pet.id} />
            <p className="text-xs text-fg-subtle">
              Reativar republica o registro na listagem pública.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const jsonLd = petArticleJsonLd(pet, getBaseUrl());
  const petUrl = `${getBaseUrl()}/pets/${id}`
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Perdemos ${pet.name ? `${pet.name} ` : ""}(${SPECIES_LABEL[pet.species]}) em ${pet.city}. Você pode ajudar? ${petUrl}`
  )}`

  // Sub-line e specs (estilo mockup pet-detalhe.html). A espécie aparece na
  // sub-line, então não é repetida como spec.
  const speciesLabel = SPECIES_LABEL[pet.species] ?? "Animal";
  const sub = [
    speciesLabel,
    pet.breed,
    pet.sex && SEX_LABEL[pet.sex],
    pet.size && `porte ${SIZE_LABEL[pet.size].toLowerCase()}`,
  ].filter(Boolean).join(" · ");

  const specs = ([
    pet.color ? { label: "Cor", value: pet.color } : null,
    pet.breed ? { label: "Raça", value: pet.breed } : null,
    pet.size ? { label: "Porte", value: SIZE_LABEL[pet.size] } : null,
    pet.sex ? { label: "Sexo", value: SEX_LABEL[pet.sex] } : null,
    pet.age_approx ? { label: "Idade", value: pet.age_approx } : null,
  ].filter(Boolean)) as { label: string; value: string }[];

  return (
    <div className="min-h-screen bg-bg" data-theme="light">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6">

        {isNew && (
          <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg">✅</span>
              <h2 className="font-bold text-green-300">
                {pet.kind === "lost"
                  ? "Alerta cadastrado! Veja o que fazer agora:"
                  : "Registrado com sucesso! Compartilhe para ajudar o tutor:"}
              </h2>
            </div>

            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">1</span>
                <div>
                  <p className="font-semibold text-fg">Compartilhe agora</p>
                  <p className="mt-0.5 text-fg-muted">Quanto mais pessoas virem, maior a chance de reencontro.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={whatsappShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                    <CopyUrlButton url={petUrl} />
                  </div>
                </div>
              </li>

              {pet.kind === "lost" && (
                <>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">2</span>
                    <div>
                      <p className="font-semibold text-fg">Avise vizinhos</p>
                      <p className="mt-0.5 text-fg-muted">Imprima este registro e deixe em comércios próximos ao local do desaparecimento.</p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">3</span>
                    <div>
                      <p className="font-semibold text-fg">Confira pets encontrados</p>
                      <p className="mt-0.5 text-fg-muted">Alguém pode ter encontrado seu pet e ainda não saber de quem é.</p>
                      <Link
                        href={`/pets?kind=found&city=${encodeURIComponent(pet.city ?? "")}`}
                        className="mt-1.5 inline-flex text-xs font-bold text-brand-400 underline hover:text-brand-300"
                      >
                        Ver pets encontrados em {pet.city}
                      </Link>
                    </div>
                  </li>
                </>
              )}
            </ol>

            <div className="mt-4 border-t border-green-500/20 pt-4">
              <Link
                href="/loja"
                className="text-xs font-bold text-brand-400 hover:text-brand-300"
              >
                🏷️ Garanta uma plaquinha de identificação — evite que isso aconteça de novo
              </Link>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <Link href="/pets" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
            <ArrowLeft className="h-4 w-4" />
            Voltar para a listagem
          </Link>
          {isOwner && (
            <div className="flex flex-wrap items-center gap-2">
              <ResolveButton petId={pet.id} kind={pet.kind as PetKind} />
              {pet.kind === "lost" && (
                <Link
                  href={`/resgate?pet=${pet.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-500/15 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-500/25"
                >
                  <Siren className="h-3.5 w-3.5" />
                  Disparar SOS
                </Link>
              )}
              <Link
                href={`/pets/${pet.id}/editar`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-raised px-3 py-1.5 text-xs font-bold text-fg hover:bg-warm-100"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Link>
            </div>
          )}
        </div>

        {/* ── Bloco principal: 2 colunas (foto | info) ── */}
        <div className="grid grid-cols-1 items-start gap-9 min-[881px]:grid-cols-[1.1fr_0.9fr]">
          {/* Coluna esquerda: foto */}
          <div>
            <div
              className="relative h-[320px] w-full overflow-hidden rounded-2xl shadow-card sm:h-[420px]"
              style={{ background: "linear-gradient(135deg,#FFE4CC,#FFD0A8)" }}
            >
              {pet.photo_url ? (
                <Image
                  src={pet.photo_url}
                  alt={pet.name ?? "Pet"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 600px"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <PawPrint className="h-20 w-20 text-brand-500/40" />
                </div>
              )}
              <div className="absolute left-3 top-3 z-10 [&>*]:px-3 [&>*]:py-1.5 [&>*]:font-bold">
                <SOSBadge kind={pet.kind as PetKind} />
              </div>
            </div>
          </div>

          {/* Coluna direita: info */}
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-fg sm:text-4xl">
              {pet.name ?? "Sem nome"}
            </h1>
            <p className="mt-1 text-[15px] text-fg-muted">{sub}</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-fg-muted">
              <MapPin className="h-4 w-4 text-brand-500" />
              {pet.neighborhood}, {pet.city}
              {pet.state && ` - ${pet.state}`}
            </p>
            <p className="mt-1 text-xs text-fg-subtle">
              {pet.kind === "lost" ? "Desaparecido" : "Encontrado"} em{" "}
              {pet.event_date ? new Date(pet.event_date).toLocaleDateString("pt-BR") : ""} ·{" "}
              {formatRelativeDate(pet.created_at)}
            </p>

            {specs.length > 0 && (
              <div className="my-6 grid grid-cols-2 gap-3">
                {specs.map((s) => (
                  <Spec key={s.label} label={s.label} value={s.value} />
                ))}
              </div>
            )}

            {pet.description && (
              <div className="mb-5">
                <h2 className="mb-1.5 font-display text-[15px] font-bold text-fg">Descrição</h2>
                <p className="text-[15px] leading-relaxed text-fg-muted">{pet.description}</p>
              </div>
            )}

            {pet.behavior && (
              <div className="mb-5">
                <h2 className="mb-1.5 font-display text-[15px] font-bold text-fg">Comportamento</h2>
                <p className="text-[15px] leading-relaxed text-fg-muted">{pet.behavior}</p>
              </div>
            )}

            {/* Contato — único lugar com esses dados */}
            <div className="rounded-2xl border border-brand-500/25 bg-gradient-to-br from-warm-200 to-bg-raised p-6 shadow-card min-[881px]:sticky min-[881px]:top-[84px]">
              <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent-text">
                🔒 Contato visível apenas nesta página
              </p>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-fg">
                    Falar com {pet.kind === "lost" ? "o tutor" : "quem encontrou"}
                  </h2>
                  {pet.contact_name && (
                    <p className="mt-0.5 text-sm text-fg-muted">
                      {pet.contact_name} · {formatPhone(pet.contact_phone)}
                    </p>
                  )}
                </div>
                {ownerProfile && !isOwner && (
                  <Link
                    href={`/perfil/${ownerProfile.id}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] text-fg-muted transition hover:border-brand-400 hover:text-fg"
                  >
                    {ownerProfile.avatar_url ? (
                      <Image
                        src={ownerProfile.avatar_url}
                        alt={ownerProfile.full_name ?? ""}
                        width={16}
                        height={16}
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500/20 text-[9px] font-bold text-brand-700">
                        {(ownerProfile.full_name ?? "?")[0]?.toUpperCase()}
                      </span>
                    )}
                    <span>{ownerProfile.full_name?.split(" ")[0] ?? "Ver perfil"}</span>
                  </Link>
                )}
              </div>

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

              {pet.kind === "lost" && (
                <p className="mt-3 text-xs text-fg-subtle">
                  Encontrou {pet.name ?? "o pet"}? Avise o tutor antes de tudo. Nunca pague recompensa antecipada.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Seções extras (funcionalidades reais), largura total ── */}
        <div className="mt-10 space-y-8">
          {pet.kind === "lost" && (
            <EmergencySafetyBanner context="lost-pet" />
          )}

          {pet.kind === "lost" && hasLocation && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-fg-muted">
                Mapa de busca
              </h2>
              <PetDetailMapClient
                petId={pet.id}
                petName={pet.name}
                species={pet.species}
                kind={pet.kind}
                latitude={Number(pet.latitude)}
                longitude={Number(pet.longitude)}
                sightings={mapSightings}
                showMetaPanel={isOwner}
              />
            </section>
          )}

          {pet.kind === "lost" && (
            <SightingsList
              petId={pet.id}
              petName={pet.name ?? "Pet"}
              petCity={pet.city}
            />
          )}

          {isOwner && pet.status === "active" && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-fg">
                🤖 Matching IA
              </h2>
              <MatchPanel
                petId={pet.id}
                petKind={pet.kind as "lost" | "found"}
                petName={pet.name}
              />
            </section>
          )}

          {isOwner && (
            <HealthTimeline
              petId={pet.id}
              initialRecords={healthRecords}
              isOwner={isOwner}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-raised px-4 py-3 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-fg">{value}</p>
    </div>
  );
}
