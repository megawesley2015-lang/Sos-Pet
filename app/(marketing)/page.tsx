import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Siren, ShieldCheck, PawPrint, MapPin } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import FaixaParceirosServer from "@/components/FaixaParceiros.server";
import "./home-mock.css";

export const dynamic = "force-dynamic";

/**
 * Landing "/" — linguagem visual do mockup (.mock-home), seções reordenadas
 * conforme pedido do Wesley + Assembleia. Dados reais do Supabase.
 *
 * Ordem: Hero → Como funciona → Hall → Impacto real → FaixaParceiros →
 *        Diferencial/SOS (original) → Por que confiar (original) → CTA final.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  if (h < 24) return `há ${h}h`;
  if (d === 1) return "há 1 dia";
  return `há ${d} dias`;
}

function emojiEspecie(species: string): string {
  const map: Record<string, string> = { dog: "🐕", cat: "🐈", bird: "🦜", other: "🐾" };
  return map[species] ?? "🐾";
}

function especiePtBR(species: string): string {
  const map: Record<string, string> = { dog: "Cachorro", cat: "Gato", bird: "Pássaro", other: "Outro" };
  return map[species] ?? "Pet";
}

// Honestidade: 0 vira "—" para não parecer plataforma abandonada (sem inventar número).
function fmt(n: number): string {
  return n > 0 ? n.toLocaleString("pt-BR") : "—";
}

type PetRow = {
  id: string;
  name: string | null;
  species: string;
  kind: string;
  neighborhood: string | null;
  city: string | null;
  photo_url: string | null;
  created_at: string;
};

type ResolvedRow = {
  id: string;
  name: string | null;
  species: string;
  breed: string | null;
  city: string | null;
  photo_url: string | null;
  event_date: string | null;
  updated_at: string;
};

function reencontrosExemplo(): ResolvedRow[] {
  const now = Date.now();
  const h = (n: number) => new Date(now - n * 3600_000).toISOString();
  return [
    { id: "ex-mel", name: "Mel", species: "dog", breed: "SRD", city: "Gonzaga, Santos", photo_url: null, event_date: h(13), updated_at: h(7) },
    { id: "ex-tom", name: "Tom", species: "cat", breed: "Gato", city: "Itararé, São Vicente", photo_url: null, event_date: h(52), updated_at: h(4) },
    { id: "ex-bidu", name: "Bidu", species: "dog", breed: "SRD", city: "Vila Matias, Santos", photo_url: null, event_date: h(126), updated_at: h(6) },
  ];
}

function tempoReencontro(eventISO: string | null, resolvedISO: string): { label: string; cls: string } {
  if (!eventISO) return { label: "🕐 reencontrado", cls: "time--mid" };
  const h = Math.max(0, Math.floor((new Date(resolvedISO).getTime() - new Date(eventISO).getTime()) / 3600_000));
  if (h < 24) return { label: `🕐 ${h || 1}h`, cls: "time--fast" };
  const d = Math.floor(h / 24);
  if (d < 4) return { label: `🕐 ${d} dias`, cls: "time--mid" };
  return { label: `🕐 ${d} dias`, cls: "time--slow" };
}

// ── Página ───────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const supabase = createServiceClient();

  let activePets: PetRow[] = [];
  let resolved: ResolvedRow[] = [];
  let usandoExemplos = false;
  let stats = { resolved: 0, total: 0, sightings: 0, prestadores: 0, active: 0 };

  try {
    const [recentes, resolvidos, totalC, resolvedC, sightingsC, prestadoresC, activeC] = await Promise.all([
      supabase
        .from("pets")
        .select("id, name, species, kind, neighborhood, city, photo_url, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("pets")
        .select("id, name, species, breed, city, photo_url, event_date, updated_at")
        .eq("status", "resolved")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase.from("pets").select("*", { count: "exact", head: true }),
      supabase.from("pets").select("*", { count: "exact", head: true }).eq("status", "resolved"),
      supabase.from("sightings").select("*", { count: "exact", head: true }),
      supabase.from("prestadores").select("*", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("pets").select("*", { count: "exact", head: true }).eq("status", "active"),
    ]);

    activePets = (recentes.data as PetRow[] | null) ?? [];
    const resolvedData = (resolvidos.data as ResolvedRow[] | null) ?? [];
    if (resolvedData.length > 0) {
      resolved = resolvedData;
    } else {
      resolved = reencontrosExemplo();
      usandoExemplos = true;
    }
    stats = {
      resolved: resolvedC.count ?? 0,
      total: totalC.count ?? 0,
      sightings: sightingsC.count ?? 0,
      prestadores: prestadoresC.count ?? 0,
      active: activeC.count ?? 0,
    };
  } catch {
    resolved = reencontrosExemplo();
    usandoExemplos = true;
  }

  const destaque = resolved[0];
  const outrosReencontros = resolved.slice(1, 3);

  return (
    <main className="mock-home">
      <div className="aurora" aria-hidden="true" />

      <div className="wrap">
        {/* ── HERO ── */}
        <section className="hero">
          <div>
            <span className="eyebrow">⚡ Rede colaborativa de resgate</span>
            <h1>
              Reencontre
              <br />
              quem <span className="brand-word">se perdeu.</span>
            </h1>
            <p className="sub">
              Cadastre seu pet desaparecido, dispare um alerta de resgate e conte
              com a rede pra trazer ele de volta. <strong>Em segundos.</strong>
            </p>
            <div className="hero-cta">
              <Link href="/achados-e-perdidos/cadastrar" className="btn btn--neon">
                ⚠️ Cadastrar pet perdido →
              </Link>
              <Link href="/achados-e-perdidos" className="btn btn--ghost">
                🔍 Ver pets na rede
              </Link>
            </div>
            <p className="trust">
              <span>✓ 100% gratuito</span>
              <span>✓ sem login obrigatório</span>
              <span>✓ anti-spam automático</span>
              <span>✓ você no controle</span>
            </p>
          </div>

          <div className="alerts">
            <div className="alerts-head">
              <span className="label">
                <span className="alerts-dot" />
                Alertas recentes
              </span>
              <span className="alerts-count">
                {stats.active} ativo{stats.active !== 1 ? "s" : ""}
              </span>
            </div>

            {activePets.length === 0 ? (
              <div className="alerts-empty">
                Nenhum alerta recente ainda.
                <br />
                <b>Seja o primeiro a cadastrar.</b>
              </div>
            ) : (
              activePets.slice(0, 4).map((p) => {
                const perdido = p.kind === "lost";
                return (
                  <Link key={p.id} href={`/achados-e-perdidos/${p.id}`} className="alert-row">
                    <div className="alert-avatar">
                      {p.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo_url} alt={p.name ?? "Pet"} />
                      ) : (
                        emojiEspecie(p.species)
                      )}
                    </div>
                    <div className="alert-info">
                      <div className="alert-top">
                        <span className={`alert-badge ${perdido ? "alert-badge--lost" : "alert-badge--found"}`}>
                          <span className="pd" />
                          {perdido ? "perdido" : "encontrado"}
                        </span>
                        <span className="alert-name">
                          {p.name ?? "Sem nome"} · {especiePtBR(p.species).toLowerCase()}
                        </span>
                      </div>
                      <div className="alert-city">📍 {[p.neighborhood, p.city].filter(Boolean).join(", ")}</div>
                    </div>
                    <span className="alert-time">{tempoRelativo(p.created_at)}</span>
                  </Link>
                );
              })
            )}

            <div className="alerts-foot">
              <Link href="/achados-e-perdidos">Ver todos os pets na rede →</Link>
            </div>
          </div>
        </section>

        {/* ── COMO FUNCIONA (Três passos) ── */}
        <section className="block">
          <div className="section-head">
            <h2>Três passos para trazer seu pet de volta</h2>
            <p>Sem custo. Movido pela comunidade da sua cidade.</p>
          </div>
          <div className="bento">
            <div className="bento-item">
              <div className="bento-ico">📣</div>
              <h3>1. Registre</h3>
              <p>Em menos de 1 minuto, descreve o pet, sobe uma foto e seu contato — ou cadastra um pet que você encontrou.</p>
            </div>
            <div className="bento-item">
              <div className="bento-ico teal">📲</div>
              <h3>2. Compartilhe</h3>
              <p>Dispare o SOS visual: gera um cartaz pronto pra colar no WhatsApp, Instagram ou imprimir.</p>
            </div>
            <div className="bento-item">
              <div className="bento-ico teal">💚</div>
              <h3>3. Reencontre</h3>
              <p>Quem viu o pet entra em contato direto via telefone ou WhatsApp. Sem intermediários.</p>
            </div>
          </div>
        </section>

        {/* ── HALL DE REENCONTROS ── */}
        {destaque && (
          <section className="block">
            <div className="hall-head">
              <div className="ti">
                <span className="hall-eyebrow">❤ Histórias reais</span>
                <h2>
                  Eles voltaram <span className="brand-word">para casa.</span>
                </h2>
                <p>Cada reencontro aqui é real. Cada hora contada é a diferença que o SOS Pet Aumigo fez na vida de um tutor.</p>
              </div>
              <div className="hall-counter">
                <b>{usandoExemplos ? "—" : fmt(stats.resolved)}</b>
                <span>
                  pets reencontrados
                  {usandoExemplos && (
                    <>
                      <br />
                      <span className="demo-tag" style={{ marginTop: 5 }}>
                        histórias de exemplo
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="reunions">
              <article className="reunion destaque">
                <div className="reunion-photo">
                  {destaque.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={destaque.photo_url} alt={destaque.name ?? "Pet reencontrado"} />
                  ) : (
                    <span className="emoji-bg">{emojiEspecie(destaque.species)}</span>
                  )}
                  <span className="overlay" />
                  <span className="sp">{emojiEspecie(destaque.species)}</span>
                  {(() => {
                    const t = tempoReencontro(destaque.event_date, destaque.updated_at);
                    return <span className={`time ${t.cls}`}>{t.label}</span>;
                  })()}
                  <span className="heart">♥</span>
                </div>
                <div className="reunion-body">
                  <h3>
                    {destaque.name ?? "Sem nome"} <small>{destaque.breed ?? especiePtBR(destaque.species)}</small>
                  </h3>
                  <p className="reunion-loc">
                    <span className="pin">📍</span> {destaque.city ?? "Baixada Santista"}
                  </p>
                  <div className="reunion-div" />
                  <span className="reunion-ok">✓ Reencontrado</span>
                </div>
              </article>

              {outrosReencontros.map((r) => {
                const t = tempoReencontro(r.event_date, r.updated_at);
                return (
                  <article key={r.id} className="reunion">
                    <div className="reunion-photo">
                      {r.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photo_url} alt={r.name ?? "Pet reencontrado"} />
                      ) : (
                        <span className="emoji-bg">{emojiEspecie(r.species)}</span>
                      )}
                      <span className="overlay" />
                      <span className="sp">{emojiEspecie(r.species)}</span>
                      <span className={`time ${t.cls}`}>{t.label}</span>
                      <span className="heart">♥</span>
                    </div>
                    <div className="reunion-body">
                      <h3>
                        {r.name ?? "Sem nome"} <small>{r.breed ?? especiePtBR(r.species)}</small>
                      </h3>
                      <p className="reunion-loc">
                        <span className="pin">📍</span> {r.city ?? "Baixada Santista"}
                      </p>
                      <div className="reunion-div" />
                      <span className="reunion-ok">✓ Reencontrado</span>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hall-all">
              <Link href="/achados-e-perdidos">Ver todos os reencontros →</Link>
            </div>
          </section>
        )}

        {/* ── IMPACTO REAL ── */}
        <section className="block">
          <div className="section-head">
            <h2>Cada número é um pet amado</h2>
            <p>Dados em tempo real da nossa rede colaborativa de resgate.</p>
          </div>
          <div className="impact">
            <div className="imp">
              <b>{fmt(stats.total)}</b>
              <span>Pets cadastrados</span>
            </div>
            <div className="imp">
              <b>{fmt(stats.resolved)}</b>
              <span>Reencontros felizes</span>
            </div>
            <div className="imp">
              <b>{fmt(stats.sightings)}</b>
              <span>Avistamentos</span>
            </div>
            <div className="imp">
              <b>{fmt(stats.prestadores)}</b>
              <span>Prestadores parceiros</span>
            </div>
          </div>
        </section>
      </div>

      {/* ── FAIXA DE PARCEIROS ── */}
      <Suspense fallback={null}>
        <FaixaParceirosServer />
      </Suspense>

      {/* ── DIFERENCIAL / BOTÃO SOS (original, mantido igual) ── */}
      <RescueHighlight />

      {/* ── POR QUE CONFIAR (original) ── */}
      <Trust />

      {/* ── CTA FINAL ── */}
      <div className="mock-home">
        <div className="wrap">
          <section className="softcta">
            <h2>Cada minuto conta. 🆘</h2>
            <p>Cadastre seu pet perdido agora — leva 2 minutos e é de graça.</p>
            <Link href="/achados-e-perdidos/cadastrar" className="btn btn--neon">
              Cadastrar pet perdido
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// CENTRAL DE RESGATE — destaque (original, tema dark — mantido a pedido do Wesley)
// ============================================================
function RescueHighlight() {
  return (
    <section className="relative overflow-hidden">
      <div
        data-theme="dark"
        className="bg-ink-900 py-20 text-fg sm:py-28"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 50%, rgba(255,133,27,0.12), transparent 60%), radial-gradient(circle at 80% 30%, rgba(32,178,170,0.08), transparent 50%)",
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
              <span className="text-brand-500 glow-text-brand">cartaz pronto</span> em segundos.
            </h2>
            <p className="mt-4 max-w-lg text-fg-muted">
              Mantenha o botão pressionado por 2 segundos — geramos um card no formato story
              (1080×1620) com a foto, descrição e seu contato, pronto pra compartilhar no WhatsApp,
              Insta ou imprimir.
            </p>
            <div className="mt-6">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400"
              >
                Criar conta para usar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative h-56 w-56">
              <div className="absolute inset-0 rounded-full bg-brand-500/30 blur-3xl" />
              <span className="absolute inset-4 rounded-full border-2 border-brand-500/40 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <span className="absolute inset-2 rounded-full border-2 border-brand-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <div className="absolute inset-10 flex items-center justify-center rounded-full bg-brand-500 text-white shadow-glow-brand-lg">
                <div className="flex flex-col items-center gap-1">
                  <Siren className="h-10 w-10" strokeWidth={2.5} />
                  <span className="font-display text-lg font-black tracking-wide">SOS</span>
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
// CONFIANÇA (original)
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
          <h2 className="font-display text-3xl font-black text-fg sm:text-4xl">
            Por que confiar no SOS Pet Aumigo?
          </h2>
          <p className="mt-3 text-fg-muted">
            Construído por quem vive a dor de perder um pet — e a alegria de reencontrar.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {points.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-warm-200 bg-warm-50 p-6 shadow-warm-card transition-[box-shadow,border-color,transform] duration-200 hover:shadow-warm-hover motion-safe:hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent-text">
                <p.icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-fg">{p.title}</h3>
              <p className="mt-1.5 text-sm text-fg-muted">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
