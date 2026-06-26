import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  BadgeCheck,
  Hand,
  Flag,
  X,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata = {
  title: "Segurança e confiança",
  description:
    "Como o SOS Pet Aumigo protege você: contato escondido na listagem, verificação anti-spam, prestadores verificados e alerta contra golpes de recompensa.",
  alternates: { canonical: "/seguranca" },
  openGraph: { url: "/seguranca", type: "website" as const },
};

const protecoes = [
  {
    icon: Lock,
    title: "Seu contato fica protegido",
    desc: "Telefone e WhatsApp nunca aparecem na listagem — só na página do pet, pra quem realmente clica pra ajudar. Nada de contato exposto pra robô coletar.",
  },
  {
    icon: ShieldCheck,
    title: "Verificação anti-spam",
    desc: "Todo cadastro passa por uma checagem automática anti-bot. Menos perfil falso, menos golpista, mais gente de verdade ajudando.",
  },
  {
    icon: BadgeCheck,
    title: "Prestadores verificados",
    desc: "Clínicas e pet shops parceiros recebem selo de verificado. Você sabe com quem está falando.",
  },
  {
    icon: Hand,
    title: "Você no controle",
    desc: "Edite, pause ou remova seu anúncio a qualquer momento, num clique. Sem precisar ligar, sem retenção, sem letra miúda.",
  },
];

const golpes = [
  {
    ok: false,
    node: (
      <>
        <strong className="text-fg">Nunca pague nada antecipado.</strong> Quem
        realmente achou seu pet não exige pagamento pra devolver.
      </>
    ),
  },
  {
    ok: false,
    node: (
      <>
        Desconfie de quem{" "}
        <strong className="text-fg">pede PIX, recarga ou dados do cartão</strong>{" "}
        pra "liberar" o animal.
      </>
    ),
  },
  {
    ok: false,
    node: (
      <>
        Cuidado com quem{" "}
        <strong className="text-fg">se recusa a mandar foto ou vídeo</strong> do
        pet na hora.
      </>
    ),
  },
  {
    ok: true,
    node: (
      <>
        Combine o encontro em{" "}
        <strong className="text-fg">local público e movimentado</strong>, e leve
        alguém com você.
      </>
    ),
  },
  {
    ok: true,
    node: (
      <>
        Lembre: o <strong className="text-fg">SOS Pet nunca cobra</strong> nada
        de tutor. Se pedirem pagamento "em nome do site", é golpe.
      </>
    ),
  },
];

export default function SegurancaPage() {
  return (
    <>
      <PageHeader
        eyebrow="🔒 Segurança e confiança"
        title="Sua segurança vem primeiro."
        description="Perder um pet já é difícil. A gente cuida pra que ninguém se aproveite da sua dor."
      />

      <div className="mx-auto max-w-5xl px-4">
        {/* Como protegemos você */}
        <section className="py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-black text-fg sm:text-3xl">
              Como protegemos você
            </h2>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {protecoes.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-warm-200 bg-white p-6 shadow-warm-card transition-[box-shadow,transform] duration-200 hover:shadow-warm-hover motion-safe:hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent-text">
                  <p.icon className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-fg">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Cuidado com golpes */}
        <section className="py-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-8 shadow-warm-card sm:p-9">
            <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-red-700">
              ⚠️ Cuidado com golpes de recompensa
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              O golpe mais comum: alguém diz que "achou" seu pet e pede dinheiro
              antes de devolver. Fique atento a estes sinais:
            </p>
            <ul className="mt-5 space-y-3">
              {golpes.map((g, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-fg">
                  {g.ok ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" strokeWidth={3} />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" strokeWidth={3} />
                  )}
                  <span className="leading-relaxed">{g.node}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Denuncie */}
        <section className="py-8">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-5 rounded-2xl border border-warm-200 bg-white p-7 shadow-warm-card">
            <Flag className="h-10 w-10 shrink-0 text-red-600" strokeWidth={2} />
            <div className="min-w-[220px] flex-1">
              <h3 className="font-display text-lg font-bold text-fg">
                Viu algo suspeito?
              </h3>
              <p className="mt-1 text-sm text-fg-muted">
                Anúncio falso, pedido de dinheiro ou comportamento estranho —
                denuncie. A gente analisa e remove rápido.
              </p>
            </div>
            <Link
              href="/parcerias"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-red-700 active:scale-95"
            >
              Denunciar anúncio
            </Link>
          </div>
        </section>

        {/* CTA final */}
        <section className="pb-20 pt-6">
          <div className="rounded-3xl border border-warm-200 bg-gradient-to-br from-warm-100 to-white p-10 text-center shadow-warm-card">
            <h2 className="font-display text-2xl font-black text-fg sm:text-3xl">
              Pode confiar na rede 💚
            </h2>
            <p className="mx-auto mt-2 max-w-md text-fg-muted">
              Gratuito, transparente e do lado de quem está procurando o pet.
            </p>
            <div className="mt-6">
              <Link
                href="/quem-somos"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400 active:scale-95"
              >
                Conheça quem somos
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
