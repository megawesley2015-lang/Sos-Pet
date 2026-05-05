import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  MapPin,
  PawPrint,
  Search,
  Share2,
  ShieldCheck,
  Siren,
  Sparkles,
  Eye,
  Users,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CountUp from "@/components/ui/CountUp";

export const dynamic = "force-dynamic";

/**
 * Landing — rota raiz "/".
 *
 * Estrutura:
 *  1. Hero híbrido (dark gradient → warm) com 2 CTAs principais
 *  2. Stats em tempo real (count de pets ativos / lost / found)
 *  3. Como funciona — 3 passos
 *  4. Destaque Central de Resgate (SOS)
 *  5. Confiança / por que confiar
 *  6. CTA final
 *
 * Server Component — busca stats reais do Supabase (count via head:true).
 */
export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();

  // Stats reais — count(*) sem trazer linhas (head:true)
  const [
    activeCount,
    lostCount,
    foundCount,
    resolvedCount,
    sightingsCount,
    prestadoresCount,
    totalPetsCount,
  ] = await Promise.all([
    supabase
      .from("pets")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("pets")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .eq("kind", "lost"),
    supabase
      .from("pets")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .eq("kind", "found"),
    supabase
      .from("pets")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved"),
    supabase
      .from("sightings")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("prestadores")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativo"),
    supabase
      .from("pets")
      .select("*", { count: "exact", head: true }),
  ]);

  const stats = {
    active: activeCount.count ?? 0,
    lost: lostCount.count ?? 0,
    found: foundCount.count ?? 0,
  };

  const richStats = {
    totalPets: totalPetsCount.count ?? 0,
    resolved: resolvedCount.count ?? 0,
    sightings: sightingsCount.count ?? 0,
    prestadores: prestadoresCount.count ?? 0,
  };

  return (
    <main>
      <Hero stats={stats} />
      <StatsBand stats={stats} />
      <HowItWorks />
      <StatsSection stats={richStats} />
      <RescueHighlight />
      <Trust />
      <FinalCTA />
    </main>
  );
}

// ============================================================
// HERO — bloco híbrido: parte dark embutida no warm
// ============================================================
function Hero({ stats }: { stats: { active: number; lost: number; found: number } }) {
  return (
    <section className="relative overflow-hidden">
      {/* Bloco dark do hero — wrapper só pra reset de cores */}
      <div
        data-theme="dark"
        className="relative bg-ink-900 text-fg"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,107,53,0.15), transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,229,255,0.10), transparent 50%)",
        }}
      >
        <div className="bg-grid-subtle">
          <div className="mx-auto max-w-6xl px-4 pt-16 pb-24 sm:pt-24 sm:pb-32">
            <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-300">
                  <Sparkles className="h-3 w-3" />
                  Rede colaborativa de resgate
                </span>

                <h1 className="mt-5 font-display text-4xl font-black leading-[1.05] sm:text-5xl lg:text-6xl">
                  Reencontre quem
                  <br />
                  <span className="text-brand-500 glow-text-brand">
                    se perdeu.
                  </span>
                </h1>

                <p className="mt-5 max-w-xl text-base text-fg-muted sm:text-lg">
                  Cadastre seu pet desaparecido, dispare um alerta de resgate e
                  conte com a rede pra trazer ele de volta. Em segundos.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/pets/novo"
                    className="group inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow-brand-lg transition-all hover:bg-brand-400 hover:shadow-glow-brand-lg active:scale-95"
                  >
                    <Siren className="h-4 w-4" strokeWidth={2.5} />
                    Cadastrar pet perdido
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link
                    href="/pets"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-cyan-500/60 bg-cyan-500/10 px-6 py-3.5 text-sm font-bold text-cyan-200 transition-all hover:bg-cyan-500/20 hover:shadow-glow-cyan active:scale-95"
                  >
                    <Search className="h-4 w-4" strokeWidth={2.5} />
                    Ver pets na rede
                  </Link>
                </div>

                <p className="mt-5 text-xs text-fg-subtle">
                  100% gratuito · sem login pra cadastrar · você no controle
                </p>
              </div>

              {/* Mini-card de stats no hero (mobile vai pro band abaixo) */}
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-brand-500/20 via-transparent to-cyan-500/20 blur-2xl" />
                  <div className="relative rounded-3xl border border-white/10 bg-ink-700/70 p-6 backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-fg-subtle">
                      Agora na rede
                    </p>
                    <p className="mt-1 font-display text-5xl font-black text-fg">
                      {stats.active.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-sm text-fg-muted">pets ativos</p>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <MiniStat
                        label="Perdidos"
                        value={stats.lost}
                        color="brand"
                      />
                      <MiniStat
                        label="Encontrados"
                        value={stats.found}
                        color="cyan"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transição visual dark → warm */}
      <div
        aria-hidden
        className="h-12 bg-gradient-to-b from-ink-900 to-warm-50"
      />
    </section>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "brand" | "cyan";
}) {
  const ring =
    color === "brand"
      ? "border-brand-500/40 text-brand-300"
      : "border-cyan-500/40 text-cyan-300";
  return (
    <div className={`rounded-xl border ${ring} bg-ink-800/50 p-3`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-black">
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

// ============================================================
// STATS BAND (visível mobile, redundante desktop)
// ============================================================
function StatsBand({
  stats,
}: {
  stats: { active: number; lost: number; found: number };
}) {
  return (
    <section className="border-y border-warm-200/80 bg-warm-100/40 py-8 lg:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 px-4 text-center">
        <BandStat label="Ativos" value={stats.active} />
        <BandStat label="Perdidos" value={stats.lost} />
        <BandStat label="Achados" value={stats.found} />
      </div>
    </section>
  );
}

function BandStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-3xl font-black text-brand-500">
        {value.toLocaleString("pt-BR")}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-widest text-ink-700">
        {label}
      </p>
    </div>
  );
}

// ============================================================
// COMO FUNCIONA — 3 passos
// ============================================================
function HowItWorks() {
  const steps = [
    {
      icon: Siren,
      title: "1. Registre",
      desc: "Em menos de 1 minuto, descreve o pet, sobe uma foto e seu contato — ou cadastra um pet que você encontrou.",
    },
    {
      icon: Share2,
      title: "2. Compartilhe",
      desc: "Dispare o SOS visual: gera um cartaz pronto pra colar no WhatsApp, Instagram ou imprimir.",
    },
    {
      icon: HeartHandshake,
      title: "3. Reencontre",
      desc: "Quem viu o pet entra em contato direto via telefone ou WhatsApp. Sem intermediários.",
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-700">
            Como funciona
          </span>
          <h2 className="mt-4 font-display text-3xl font-black text-ink-900 sm:text-4xl">
            Três passos para trazer
            <br />
            seu pet de volta.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.title}
              className="relative rounded-2xl border border-warm-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
                <s.icon className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// STATS SECTION — métricas de impacto com count-up animado
// ============================================================
function StatsSection({
  stats,
}: {
  stats: {
    totalPets: number;
    resolved: number;
    sightings: number;
    prestadores: number;
  };
}) {
  const items = [
    {
      value: stats.totalPets,
      suffix: "+",
      label: "Pets cadastrados",
      desc: "animais registrados na rede desde o início",
      color: "brand",
      icon: PawPrint,
    },
    {
      value: stats.resolved,
      suffix: "",
      label: "Reencontros felizes",
      desc: "pets que voltaram para casa",
      color: "cyan",
      icon: HeartHandshake,
    },
    {
      value: stats.sightings,
      suffix: "+",
      label: "Avistamentos",
      desc: "registros de quem ajudou sem ser tutor",
      color: "brand",
      icon: Eye,
    },
    {
      value: stats.prestadores,
      suffix: "",
      label: "Prestadores parceiros",
      desc: "veterinários e pet shops na rede",
      color: "cyan",
      icon: Users,
    },
  ] as const;

  return (
    <section className="relative overflow-hidden bg-ink-900 py-20 sm:py-28" data-theme="dark">
      {/* Fundo gradiente sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 50%, rgba(255,107,53,0.10), transparent 50%), radial-gradient(circle at 85% 50%, rgba(0,229,255,0.08), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4">
        {/* Cabeçalho */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-300">
            Impacto real
          </span>
          <h2 className="mt-4 font-display text-3xl font-black text-fg sm:text-4xl">
            Cada número é um{" "}
            <span className="text-brand-400 glow-text-brand">pet amado</span>.
          </h2>
          <p className="mt-3 text-sm text-fg-muted">
            Dados em tempo real da nossa rede colaborativa de resgate.
          </p>
        </div>

        {/* Grid de métricas */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;
            const isOrange = item.color === "brand";
            return (
              <div
                key={item.label}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-ink-700/60 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-ink-700/80"
              >
                {/* Glow de fundo no hover */}
                <div
                  className={`pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 ${
                    isOrange
                      ? "bg-gradient-to-br from-brand-500/10 via-transparent to-transparent"
                      : "bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent"
                  }`}
                />

                <div
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${
                    isOrange
                      ? "bg-brand-500/20 text-brand-400"
                      : "bg-cyan-500/20 text-cyan-400"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </div>

                <p
                  className={`relative mt-4 font-display text-4xl font-black tabular-nums ${
                    isOrange ? "text-brand-400" : "text-cyan-300"
                  }`}
                >
                  <CountUp to={item.value} suffix={item.suffix} />
                </p>

                <p className="relative mt-1 text-sm font-bold text-fg">
                  {item.label}
                </p>
                <p className="relative mt-1 text-xs leading-relaxed text-fg-subtle">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// CENTRAL DE RESGATE — destaque
// ============================================================
function RescueHighlight() {
  return (
    <section className="relative overflow-hidden">
      <div
        data-theme="dark"
        className="bg-ink-900 py-20 text-fg sm:py-28"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 50%, rgba(255,107,53,0.12), transparent 60%), radial-gradient(circle at 80% 30%, rgba(0,229,255,0.08), transparent 50%)",
        }}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-300">
              <Siren className="h-3 w-3" />
              Diferencial
            </span>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight sm:text-4xl">
              Botão SOS gera um
              <br />
              <span className="text-brand-500 glow-text-brand">
                cartaz pronto
              </span>{" "}
              em segundos.
            </h2>
            <p className="mt-4 max-w-lg text-fg-muted">
              Mantenha o botão pressionado por 2 segundos — geramos um card no
              formato story (1080×1620) com a foto, descrição e seu contato,
              pronto pra compartilhar no WhatsApp, Insta ou imprimir.
            </p>
            <div className="mt-6">
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400"
              >
                Criar conta para usar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Visualização do botão SOS — só estática (versão real precisa de client) */}
          <div className="flex justify-center">
            <div className="relative h-56 w-56">
              <div className="absolute inset-0 rounded-full bg-brand-500/30 blur-3xl" />
              <span
                className="absolute inset-4 rounded-full border-2 border-brand-500/40"
                style={{ animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}
              />
              <span
                className="absolute inset-2 rounded-full border-2 border-brand-500/30"
                style={{ animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }}
              />
              <div className="absolute inset-10 flex items-center justify-center rounded-full bg-brand-500 text-white shadow-glow-brand-lg">
                <div className="flex flex-col items-center gap-1">
                  <Siren className="h-10 w-10" strokeWidth={2.5} />
                  <span className="font-display text-lg font-black tracking-wide">
                    SOS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// CONFIANÇA
// ============================================================
function Trust() {
  const points = [
    {
      icon: ShieldCheck,
      title: "Seus dados ficam com você",
      desc: "O contato só aparece na página do pet. Não vendemos ou compartilhamos sua informação com terceiros.",
    },
    {
      icon: PawPrint,
      title: "Sem login pra cadastrar",
      desc: "Quem encontra um pet na rua pode registrar em segundos, sem barreiras. Tutores criam conta pra gerenciar.",
    },
    {
      icon: MapPin,
      title: "Foco no Brasil",
      desc: "Filtros por bairro e cidade pra reencontrar quem tá perto. Seu raio, sua rede.",
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-black text-ink-900 sm:text-4xl">
            Por que confiar no SOS Pet?
          </h2>
          <p className="mt-3 text-ink-700">
            Construído por quem vive a dor de perder um pet — e a alegria de
            reencontrar.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {points.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-warm-200 bg-warm-50 p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                <p.icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-ink-900">
                {p.title}
              </h3>
              <p className="mt-1.5 text-sm text-ink-700">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// CTA FINAL
// ============================================================
function FinalCTA() {
  return (
    <section className="pb-20 sm:pb-28">
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-10 text-center text-white shadow-glow-brand-lg sm:p-16">
          <div
            aria-hidden
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3), transparent 40%), radial-gradient(circle at 80% 80%, rgba(0,229,255,0.3), transparent 40%)",
            }}
          />
          <div className="relative">
            <h2 className="font-display text-3xl font-black leading-tight sm:text-4xl">
              Cada minuto conta.
              <br />
              Comece agora.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/90 sm:text-base">
              Cadastre um pet ou crie sua conta gratuita pra usar a Central de
              Resgate.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/pets/novo"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand-600 transition-all hover:bg-warm-50 active:scale-95"
              >
                <Siren className="h-4 w-4" strokeWidth={2.5} />
                Cadastrar pet
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/60 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
              >
                Criar conta grátis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
