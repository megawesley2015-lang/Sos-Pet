import Link from "next/link";
import {
  Gift,
  Handshake,
  Lock,
  MapPin,
  Siren,
  Eye,
  Heart,
  Stethoscope,
  ShoppingBag,
} from "lucide-react";
import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata = {
  title: "Quem somos",
  description:
    "O SOS Pet Aumigo é uma rede colaborativa da Baixada Santista para reencontrar pets perdidos — gratuita para quem procura, sustentada pela comunidade, não por anúncio pago.",
  alternates: { canonical: "/quem-somos" },
  openGraph: { url: "/quem-somos", type: "website" as const },
};

const valores = [
  {
    icon: Gift,
    teal: false,
    title: "Gratuito pra quem procura",
    desc: "Nunca cobramos de quem está em pânico procurando o pet. Cadastrar e buscar é de graça, pra sempre.",
  },
  {
    icon: Handshake,
    teal: true,
    title: "Comunidade, não anúncio",
    desc: "O alcance vem de tutores, protetores e prestadores reais da sua cidade — não de um impulsionamento pago sem garantia.",
  },
  {
    icon: MapPin,
    teal: false,
    title: "Raiz na Baixada",
    desc: "Somos daqui. Conhecemos Santos, Guarujá, São Vicente e as 9 cidades. Rede local funciona melhor que alcance genérico.",
  },
  {
    icon: Lock,
    teal: true,
    title: "Seus dados, seu controle",
    desc: "Seu contato só aparece pra quem clica pra ajudar. Sem spam, sem vender seus dados, sem letra miúda.",
  },
];

const cidades = [
  "Santos",
  "Guarujá",
  "São Vicente",
  "Praia Grande",
  "Cubatão",
  "Bertioga",
  "Mongaguá",
  "Itanhaém",
  "Peruíbe",
];

const sustento = [
  {
    icon: Stethoscope,
    title: "Prestadores parceiros",
    desc: "Clínicas e pet shops pagam pra aparecer pra quem precisa de serviço.",
  },
  {
    icon: ShoppingBag,
    title: "Loja de plaquinhas",
    desc: "Plaquinhas com QR Code — parte da renda apoia a rede e ONGs.",
  },
  {
    icon: Heart,
    title: "Apoiadores",
    desc: "Quem acredita na causa pode apoiar voluntariamente. Sem obrigação.",
  },
];

export default function QuemSomosPage() {
  return (
    <>
      <PageHeader
        eyebrow="💚 Quem somos"
        title="Uma rede de gente. Não um anúncio pago."
        description="O SOS Pet Aumigo nasceu na Baixada Santista pra resolver o desespero de perder um pet com a força da comunidade — sem cobrar de quem mais precisa."
      />

      <div className="mx-auto max-w-5xl px-4">
        {/* Por que existimos */}
        <section className="py-14">
          <div className="mx-auto max-w-3xl rounded-2xl border border-warm-200 bg-white p-8 shadow-warm-card sm:p-9">
            <h2 className="font-display text-2xl font-bold text-fg">
              Por que existimos 🐾
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
              O SOS Pet Aumigo é um projeto que está nascendo na Baixada Santista
              com uma convicção simples: quem reúne um pet perdido com a família é
              a <strong className="text-fg">comunidade</strong> — vizinhos,
              protetores, clínicas e pet shops perto de você —, não um anúncio
              pago.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
              A gente observou que algumas plataformas cobram caro de tutores em
              pânico pra "impulsionar" um post, muitas vezes sem garantia.
              Discordamos disso. Por isso o SOS Pet é, desde o primeiro dia,{" "}
              <strong className="text-fg">gratuito pra quem procura</strong> e
              movido pela rede local — sustentado por quem quer apoiar a causa,
              nunca pelo bolso de quem está sofrendo.
            </p>
          </div>
        </section>

        {/* Valores */}
        <section className="py-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-black text-fg sm:text-3xl">
              No que a gente acredita
            </h2>
            <p className="mt-2 text-fg-muted">
              Quatro princípios que guiam cada decisão.
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {valores.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-warm-200 bg-white p-6 shadow-warm-card transition-[box-shadow,transform] duration-200 hover:shadow-warm-hover motion-safe:hover:-translate-y-1"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    v.teal
                      ? "bg-accent/10 text-accent-text"
                      : "bg-brand-500/10 text-brand-600"
                  }`}
                >
                  <v.icon className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-fg">
                  {v.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Onde a rede atua */}
        <section className="py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-black text-fg sm:text-3xl">
              Onde a rede atua
            </h2>
            <p className="mt-2 text-fg-muted">
              Nascemos local. A rede cobre as 9 cidades da Baixada Santista.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            {cidades.map((c) => (
              <span
                key={c}
                className="rounded-full border border-warm-200 bg-warm-100 px-4 py-2 text-sm font-semibold text-brand-700"
              >
                {c}
              </span>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-fg-muted">
            🌱 Estamos começando — cada cadastro e cada compartilhamento
            fortalece a rede da sua cidade.
          </p>
        </section>

        {/* Como a gente se sustenta */}
        <section className="py-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/5 to-warm-50 p-8 shadow-warm-card sm:p-10">
            <h2 className="font-display text-2xl font-bold text-fg">
              Como a gente se sustenta 💡
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              Transparência total: o tutor nunca paga pra achar o pet. A
              plataforma se mantém de três formas — todas longe do bolso de quem
              está em pânico.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {sustento.map((s) => (
                <div
                  key={s.title}
                  className="rounded-xl border border-warm-200 bg-white p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent-text">
                    <s.icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold text-fg">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Faixa de segurança */}
        <section className="py-8">
          <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-6 py-5 text-sm leading-relaxed text-fg-muted">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" strokeWidth={2.2} />
            <span>
              <strong className="text-accent-text">
                Segurança em primeiro lugar.
              </strong>{" "}
              O SOS Pet nunca pede pagamento de recompensa, e o contato do tutor
              só aparece pra quem realmente clica pra ajudar. Desconfie de quem
              cobra pra "devolver" um pet — golpe se aproveita da dor de quem
              perdeu.{" "}
              <Link href="/seguranca" className="font-semibold text-accent-text underline">
                Saiba como nos protegemos
              </Link>
              .
            </span>
          </div>
        </section>

        {/* CTA final */}
        <section className="pb-20 pt-6">
          <div className="rounded-3xl border border-warm-200 bg-gradient-to-br from-warm-100 to-white p-10 text-center shadow-warm-card">
            <h2 className="font-display text-2xl font-black text-fg sm:text-3xl">
              Faça parte da rede 💚
            </h2>
            <p className="mx-auto mt-2 max-w-md text-fg-muted">
              Cada pessoa tem um papel: cadastrar, avisar um avistamento ou
              compartilhar.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/pets/novo"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400 active:scale-95"
              >
                <Siren className="h-4 w-4" strokeWidth={2.5} />
                Perdi meu pet
              </Link>
              <Link
                href="/avistamentos/novo"
                className="inline-flex items-center gap-2 rounded-xl border border-warm-200 bg-white px-6 py-3.5 text-sm font-bold text-fg transition-all hover:border-brand-200 hover:text-brand-600 active:scale-95"
              >
                <Eye className="h-4 w-4" strokeWidth={2.2} />
                Vi um pet por aí
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
