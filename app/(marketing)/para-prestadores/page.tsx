import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  Globe,
  HeartHandshake,
  MapPin,
  MessageCircle,
  PawPrint,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Para Prestadores · SOS Pet Aumigo",
  description:
    "Apareça pra mais de 1.000 tutores de pets na Baixada Santista. Cadastro gratuito · Badge verificado · Destaque no mapa.",
  alternates: { canonical: "/para-prestadores" },
  openGraph: {
    title: "Atraia mais clientes pet na Baixada Santista · SOS Pet Aumigo",
    description:
      "71% dos brasileiros busca serviços pet online toda semana. Apareça pra quem está procurando agora.",
    url: "/para-prestadores",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

const PLANOS = [
  {
    id: "gratuito",
    nome: "Gratuito",
    preco: "R$ 0",
    periodo: "para sempre",
    destaque: false,
    recursos: [
      "Perfil público no diretório",
      "Foto, endereço e categoria",
      "Contato por WhatsApp",
      "Aparece na busca local",
    ],
    cta: "Cadastrar grátis",
    href: "/prestadores/novo",
  },
  {
    id: "verificado",
    nome: "Verificado",
    preco: "R$ 49",
    periodo: "por mês",
    destaque: true,
    badge: "Mais popular",
    recursos: [
      "Tudo do plano gratuito",
      "Badge ✓ Verificado no perfil",
      "Destaque no topo da busca",
      "Pin no mapa com cor diferente",
      "Botão de agendamento direto",
      "Relatório mensal de visitas",
      "Suporte prioritário",
    ],
    cta: "Quero ser verificado",
    href: "/parcerias",
  },
  {
    id: "parceiro",
    nome: "Parceiro Estratégico",
    preco: "R$ 149",
    periodo: "por mês",
    destaque: false,
    recursos: [
      "Tudo do plano Verificado",
      "Banner patrocinado na home",
      "Notificação push pra tutores próximos",
      "Integração com avistamentos (alerta SOS)",
      "Página personalizada com SEO local",
      "Relatório avançado com mapa de calor",
    ],
    cta: "Falar com comercial",
    href: "/parcerias",
  },
];

const BENEFICIOS = [
  {
    icon: Users,
    titulo: "Tutores ativos todo dia",
    desc: "Famílias que perderam ou encontraram pets — exatamente o momento em que mais precisam de um veterinário, pet shop ou cuidador de confiança.",
  },
  {
    icon: Globe,
    titulo: "Visibilidade que você possui",
    desc: 'Diferente de Instagram ou TikTok, seu perfil aqui não some por mudança de algoritmo. É um "imóvel" no terreno da nossa plataforma.',
  },
  {
    icon: MapPin,
    titulo: "Geolocalização por bairro",
    desc: "Apareça pra tutores que estão literalmente no seu raio de atendimento. Sem desperdício de verba em quem fica do outro lado da cidade.",
  },
  {
    icon: BadgeCheck,
    titulo: "Badge verificado gera confiança",
    desc: "Momento de crise (pet perdido) precisa de fornecedor de confiança. O badge é o diferencial que faz o tutor clicar em você e não no concorrente.",
  },
  {
    icon: TrendingUp,
    titulo: "Cresça com a rede",
    desc: "Cada novo tutor cadastrado é um cliente em potencial pra você. Quanto mais a plataforma cresce, mais visível você fica — sem pagar mais por isso.",
  },
  {
    icon: MessageCircle,
    titulo: "Contato direto sem intermediário",
    desc: "Nenhuma taxa de intermediação por agendamento. O tutor clica, cai no seu WhatsApp. Você fecha o atendimento no seu ritmo.",
  },
];

const FAQS = [
  {
    q: "Preciso de CNPJ pra me cadastrar?",
    a: "Não. Profissionais autônomos (adestrador, cuidador) também podem criar perfil. O CNPJ é opcional e ajuda na credibilidade, mas não é obrigatório.",
  },
  {
    q: "O plano gratuito some do diretório se eu não pagar?",
    a: "Não. O gratuito é pra sempre. Você só ativa recursos extras ao assinar o Verificado. Sem cobrança surpresa, sem cancelamento automático.",
  },
  {
    q: "Posso atualizar minhas informações depois de cadastrar?",
    a: "Sim, você tem um dashboard de prestador onde edita horários, serviços, fotos e contato a qualquer momento.",
  },
  {
    q: "Como o plano Verificado me deixa no topo da busca?",
    a: "Aplicamos um boost de relevância no algoritmo de listagem. Quando o tutor filtra por categoria e cidade, prestadores Verificados aparecem primeiro dentro dos resultados relevantes.",
  },
  {
    q: "Tem contrato de fidelidade?",
    a: "Nenhum. Você cancela quando quiser, sem multa. O acesso ao plano premium vai até o fim do período pago.",
  },
];

export default async function ParaPrestadoresPage() {
  const supabase = createServiceClient();

  const prestadoresRes = await supabase
    .from("prestadores")
    .select("*", { count: "exact", head: true })
    .eq("status", "ativo");

  const prestadores = prestadoresRes.count ?? 0;

  return (
    <main>
      {/* ──────────────────────────────────────────────
          HERO
      ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 py-20 text-white sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 30%, rgba(255,133,27,0.15), transparent 50%), radial-gradient(circle at 90% 70%, rgba(32,178,170,0.10), transparent 50%)",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-300">
            <Sparkles className="h-3 w-3" />
            Para veterinários, pet shops e cuidadores
          </span>

          <h1 className="mt-5 font-display text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            Apareça pra{" "}
            <span className="text-brand-400">
              50.000+ famílias
            </span>
            <br />
            com pets na Baixada Santista.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
            71% dos brasileiros busca serviços pet online toda semana.
            A Baixada Santista está procurando você agora — e a maioria dos seus
            concorrentes ainda não tem presença digital.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/prestadores/novo"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-7 py-4 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400 active:scale-95"
            >
              Cadastrar grátis agora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#planos"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              Ver planos
              <ChevronDown className="h-4 w-4" />
            </Link>
          </div>

          {/* Stats rápidos */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
            {[
              { label: "Famílias com pets na região", value: "50.000+" },
              { label: "Cidades da Baixada Santista", value: "9" },
              { label: "Prestadores na rede", value: prestadores.toLocaleString("pt-BR") },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl font-black text-brand-400">
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          PROBLEMA → INSIGHT
      ────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
            O problema
          </p>
          <h2 className="mt-3 font-display text-3xl font-black text-fg sm:text-4xl">
            Quase metade dos prestadores pet
            <br />
            <span className="text-brand-500">não tem site nem presença digital.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-fg-muted">
            O Sebrae publicou que{" "}
            <strong className="text-fg">47% das pequenas empresas brasileiras</strong>{" "}
            não tem página própria. Na prática, significa que{" "}
            <strong className="text-fg">
              você some do radar do tutor no exato momento em que ele mais precisa
            </strong>{" "}
            — quando o pet se perde ou adoece e ele vai buscar ajuda online.
          </p>
          <div className="mt-8 inline-block rounded-2xl border border-brand-200 bg-brand-50 px-6 py-4 text-left">
            <p className="text-sm font-bold text-brand-800">
              Ao se cadastrar no SOS Pet Aumigo, você automaticamente está à
              frente da metade dos seus concorrentes — antes de fazer qualquer
              outra coisa.
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          BENEFÍCIOS
      ────────────────────────────────────────────── */}
      <section className="bg-warm-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
              Por que faz sentido
            </p>
            <h2 className="mt-3 font-display text-3xl font-black text-fg sm:text-4xl">
              O que você ganha na rede
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFICIOS.map((b) => (
              <div
                key={b.titulo}
                className="rounded-2xl border border-warm-200 bg-white p-6 shadow-warm-card transition-all hover:shadow-warm-hover hover:border-brand-200"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
                  <b.icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-fg">
                  {b.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          MOMENTO CERTO — PROVA SOCIAL
      ────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
                O momento certo
              </p>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight text-fg sm:text-4xl">
                O tutor está no seu
                <br />
                <span className="text-cyan-600">pior momento emocional</span>
                <br />
                quando te encontra.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-fg-muted">
                Alguém que perdeu um pet não vai comparar preço por horas.{" "}
                <strong className="text-fg">
                  Vai contratar o primeiro prestador de confiança que encontrar.
                </strong>{" "}
                Esse é o seu diferencial: aparecer no lugar certo, na hora certa,
                com o badge de verificado.
              </p>
              <p className="mt-4 text-base leading-relaxed text-fg-muted">
                Pense assim: cada tutor que usa a plataforma pra achar o pet já é
                um cliente em potencial pra vacinação, consulta, banho e tosa,
                hospedagem. Você deposita presença agora —{" "}
                <strong className="text-fg">saca clientes pelo resto do ano.</strong>
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: HeartHandshake,
                  txt: "Pet reencontrado → tutor aliviado → agendamento de consulta de rotina",
                },
                {
                  icon: Zap,
                  txt: "Avistamento de pet perdido → tutores próximos notificados → seu nome em destaque no raio",
                },
                {
                  icon: Star,
                  txt: "Perfil verificado → mais cliques → mais avaliações → mais topo na busca",
                },
                {
                  icon: BarChart3,
                  txt: "Relatório mensal mostra quantos tutores viram seu perfil e clicaram no WhatsApp",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-xl border border-warm-200 bg-warm-50 p-4"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                    <item.icon className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <p className="text-sm leading-relaxed text-fg-muted">
                    {item.txt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          PLANOS
      ────────────────────────────────────────────── */}
      <section id="planos" className="bg-ink-900 py-20 sm:py-28" data-theme="dark">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">
              Planos
            </p>
            <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">
              Comece grátis.{" "}
              <span className="text-brand-400">Escale quando quiser.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">
              Sem contrato de fidelidade. Sem cobrança surpresa. Cancele quando quiser.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANOS.map((plano) => (
              <div
                key={plano.id}
                className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                  plano.destaque
                    ? "border-brand-500 bg-brand-500/10 shadow-glow-brand"
                    : "border-white/10 bg-ink-700/60 hover:border-white/20"
                }`}
              >
                {plano.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-brand-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-glow-brand">
                      {plano.badge}
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                    {plano.nome}
                  </p>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="font-display text-4xl font-black text-white">
                      {plano.preco}
                    </span>
                    <span className="mb-1 text-sm text-white/40">
                      /{plano.periodo}
                    </span>
                  </div>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plano.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-2.5 text-sm text-white/80">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                        strokeWidth={2.5}
                      />
                      {r}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link
                    href={plano.href}
                    className={`block w-full rounded-xl py-3 text-center text-sm font-bold transition-all active:scale-95 ${
                      plano.destaque
                        ? "bg-brand-500 text-white shadow-glow-brand hover:bg-brand-400"
                        : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {plano.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-white/30">
            * Preços em fase beta — pode haver reajuste com aviso prévio de 30 dias.
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          QUEM PODE SE CADASTRAR
      ────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h2 className="font-display text-2xl font-black text-fg sm:text-3xl">
              Quem pode se cadastrar?
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "🏥", label: "Clínicas veterinárias" },
              { icon: "🛁", label: "Banho e tosa" },
              { icon: "🏠", label: "Hospedagem pet" },
              { icon: "🐕", label: "Adestramento" },
              { icon: "🛒", label: "Pet shops" },
              { icon: "💉", label: "Vacinação domiciliar" },
              { icon: "🚗", label: "Transporte pet" },
              { icon: "👩‍⚕️", label: "Veterinário autônomo" },
              { icon: "🐾", label: "Cuidador / pet sitter" },
            ].map((cat) => (
              <div
                key={cat.label}
                className="flex items-center gap-3 rounded-xl border border-warm-200 bg-warm-50 px-4 py-3"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-sm font-medium text-fg">{cat.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-fg-muted">
            Não viu sua categoria?{" "}
            <Link href="/parcerias" className="font-bold text-brand-600 hover:text-brand-500">
              Fale com a gente
            </Link>{" "}
            — provavelmente dá.
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          FAQ
      ────────────────────────────────────────────── */}
      <section className="bg-warm-50 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center font-display text-2xl font-black text-fg sm:text-3xl">
            Dúvidas frequentes
          </h2>
          <div className="mt-10 space-y-4">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-warm-200 bg-white p-5"
              >
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" strokeWidth={2} />
                  <div>
                    <p className="font-bold text-fg">{faq.q}</p>
                    <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          CTA FINAL
      ────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-10 text-center text-white shadow-glow-brand-lg sm:p-16">
            <div
              aria-hidden
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(32,178,170,0.3), transparent 40%)",
              }}
            />
            <div className="relative">
              <PawPrint className="mx-auto h-10 w-10 opacity-80" strokeWidth={2} />
              <h2 className="mt-4 font-display text-3xl font-black leading-tight sm:text-4xl">
                Lança agora.
                <br />
                Melhora no percurso.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-white/85 sm:text-base">
                O mercado não espera. Cada dia sem presença digital é um cliente
                que foi pro concorrente. Comece grátis em 5 minutos.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  href="/prestadores/novo"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand-600 transition-all hover:bg-warm-50 active:scale-95"
                >
                  <Building2 className="h-4 w-4" strokeWidth={2.5} />
                  Cadastrar gratuitamente
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/parcerias"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-white/50 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Falar com comercial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
