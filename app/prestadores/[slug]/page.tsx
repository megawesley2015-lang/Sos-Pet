import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Eye,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Pencil,
  ShieldCheck,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StarRating } from "@/components/providers/StarRating";
import { AvaliacaoForm } from "@/components/providers/AvaliacaoForm";
import { AvaliacoesList } from "@/components/providers/AvaliacoesList";
import { WhatsappButton } from "@/components/providers/WhatsappButton";
import { PhoneButton } from "@/components/providers/PhoneButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import {
  CATEGORIA_LABEL,
  getProviderBySlug,
  getProviderStats,
  incrementProviderView,
} from "@/lib/services/providers";
import { listReviewsByProvider, getMyReview } from "@/lib/services/reviews";
import { formatPhone } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PrestadorDetalhePage({ params }: PageProps) {
  const { slug } = await params;

  const prestador = await getProviderBySlug(slug);
  if (!prestador || prestador.status !== "ativo") {
    notFound();
  }

  // Em paralelo: stats + reviews + sessão do user
  const supabase = await createSupabaseServerClient();
  const [stats, reviews, user] = await Promise.all([
    getProviderStats(prestador.id),
    listReviewsByProvider(prestador.id),
    getUserSafe(supabase),
  ]);

  // Não esperamos — incremento em background
  // (Server Components não suportam "fire and forget" puro, mas o RPC já é
  //  async e não muda a resposta atual; é "best effort" pra não atrasar SSR)
  void incrementProviderView(prestador.id);

  const isOwner = !!user && prestador.user_id === user.id;
  const myReview = user ? await getMyReview(prestador.id) : null;

  return (
    <div className="min-h-screen bg-ink-800">
      <TopBar />

      <main className="mx-auto max-w-4xl px-4 pb-16">
        {/* Capa */}
        <div className="relative -mx-4 h-44 overflow-hidden bg-gradient-to-br from-ink-700 to-ink-900 sm:h-56">
          {prestador.capa_url ? (
            <Image
              src={prestador.capa_url}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-grid-subtle opacity-40" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-800 via-ink-800/70 to-transparent" />
        </div>

        {/* Header / identidade */}
        <header className="-mt-12 px-1 sm:px-2">
          <div className="flex flex-wrap items-start gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-ink-800 bg-ink-700">
              {prestador.logo_url ? (
                <Image
                  src={prestador.logo_url}
                  alt={prestador.nome}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Building2 className="h-10 w-10 text-cyan-500/50" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-12">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-fg sm:text-3xl">
                  {prestador.nome}
                </h1>
                {prestador.verificado && (
                  <span
                    title="Verificado"
                    className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[11px] font-bold text-cyan-300"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Verificado
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-cyan-400">
                {CATEGORIA_LABEL[prestador.categoria]}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
                <MapPin className="h-3.5 w-3.5 text-brand-500" />
                {prestador.bairro ? `${prestador.bairro}, ` : ""}
                {prestador.cidade}
                {prestador.estado ? ` — ${prestador.estado}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && (
                <Link
                  href={`/prestadores/${slug}/editar`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-fg hover:bg-white/10"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Link>
              )}
              <Link
                href="/prestadores"
                className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </Link>
            </div>
          </div>
        </header>

        {/* Stats + Avaliação resumo */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-700/50 p-4">
            <Star className="h-7 w-7 fill-brand-500 text-brand-500" />
            <div className="flex-1">
              <p className="font-display text-2xl font-bold text-fg">
                {prestador.media_avaliacoes.toFixed(1)}
                <span className="ml-1 text-sm font-normal text-fg-muted">
                  / 5
                </span>
              </p>
              <p className="text-xs text-fg-muted">
                {prestador.total_avaliacoes}{" "}
                {prestador.total_avaliacoes === 1
                  ? "avaliação"
                  : "avaliações"}
              </p>
            </div>
            <StarRating
              name="overall"
              readOnly
              value={prestador.media_avaliacoes}
              size="sm"
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-700/50 p-4">
            <Eye className="h-7 w-7 text-cyan-400" />
            <div>
              <p className="font-display text-2xl font-bold text-fg">
                {(stats?.visualizacoes ?? 0).toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-fg-muted">visualizações</p>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="mt-4 flex flex-wrap gap-2">
          {prestador.emergencia24h && (
            <Badge icon={Zap} label="Atende 24h" color="brand" />
          )}
          {prestador.delivery && (
            <Badge icon={Truck} label="Faz delivery" color="cyan" />
          )}
          {prestador.agendamento_online && (
            <Badge icon={ExternalLink} label="Agendamento online" color="cyan" />
          )}
        </section>

        {/* Sobre */}
        {prestador.descricao && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-ink-700/40 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-fg-muted">
              Sobre
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-fg">
              {prestador.descricao}
            </p>
          </section>
        )}

        {/* Contato — hero */}
        <section className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wide text-cyan-300">
            Entre em contato
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {prestador.whatsapp && (
              <WhatsappButton
                prestadorId={prestador.id}
                phone={prestador.whatsapp}
                prestadorNome={prestador.nome}
              />
            )}
            {prestador.telefone && !prestador.whatsapp && (
              <PhoneButton
                prestadorId={prestador.id}
                phone={prestador.telefone}
              />
            )}
            {prestador.telefone && prestador.whatsapp && (
              <PhoneButton
                prestadorId={prestador.id}
                phone={prestador.telefone}
              />
            )}
          </div>

          <ul className="mt-4 space-y-2 text-sm text-fg">
            {prestador.endereco && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />
                <span>{prestador.endereco}</span>
              </li>
            )}
            {prestador.telefone && (
              <li className="flex items-center gap-2">
                <span className="text-xs text-fg-muted">Telefone:</span>
                <span>{formatPhone(prestador.telefone)}</span>
              </li>
            )}
            {prestador.whatsapp && (
              <li className="flex items-center gap-2">
                <span className="text-xs text-fg-muted">WhatsApp:</span>
                <span>{formatPhone(prestador.whatsapp)}</span>
              </li>
            )}
            {prestador.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-fg-muted" />
                <a
                  href={`mailto:${prestador.email}`}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {prestador.email}
                </a>
              </li>
            )}
            {prestador.instagram && (
              <li className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-fg-muted" />
                <a
                  href={`https://instagram.com/${prestador.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  @{prestador.instagram}
                </a>
              </li>
            )}
            {prestador.site && (
              <li className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-fg-muted" />
                <a
                  href={prestador.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {prestador.site.replace(/^https?:\/\//, "")}
                </a>
              </li>
            )}
          </ul>
        </section>

        {/* Avaliações */}
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl font-bold text-fg">
            Avaliações
          </h2>

          <div className="mb-6 rounded-2xl border border-white/10 bg-ink-700/40 p-5">
            <AvaliacaoForm
              prestadorId={prestador.id}
              slug={slug}
              isLoggedIn={!!user}
              myReview={myReview}
            />
          </div>

          <AvaliacoesList reviews={reviews} />
        </section>
      </main>
    </div>
  );
}

function Badge({
  icon: Icon,
  label,
  color,
}: {
  icon: typeof Zap;
  label: string;
  color: "brand" | "cyan";
}) {
  const cls =
    color === "brand"
      ? "border-brand-500/40 bg-brand-500/10 text-brand-300"
      : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
