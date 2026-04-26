import { HeartHandshake, Megaphone, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ParceriaForm } from "./ParceriaForm";

export const metadata = {
  title: "Parcerias — SOS Pet",
  description:
    "Empresas, ONGs e profissionais que querem ampliar a rede de resgate. Vamos conversar.",
};

const beneficios = [
  {
    icon: Megaphone,
    title: "Visibilidade na rede",
    desc: "Apareça pra tutores ativos e quem busca cuidado pro pet — destaque, badge verificado e estatísticas.",
  },
  {
    icon: HeartHandshake,
    title: "Causa real",
    desc: "Sua marca conectada com reencontros que mudam vidas. Histórias que viralizam organicamente.",
  },
  {
    icon: ShieldCheck,
    title: "Sem pagar pra falar",
    desc: "MVP é gratuito pra cadastrar prestador. Parcerias institucionais são pra escalar reach e operação.",
  },
];

export default function ParceriasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Parcerias"
        title="Vamos juntos resgatar mais pets"
        description="Conte sobre sua organização e como você quer somar com a rede SOS Pet."
      />

      <section className="py-16">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 lg:grid-cols-[1.1fr_1fr]">
          {/* Esquerda: pitch */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-700">
              <Sparkles className="h-3 w-3" />
              Por que se juntar
            </span>

            <h2 className="mt-4 font-display text-2xl font-black leading-tight text-ink-900 sm:text-3xl">
              Trabalhamos com{" "}
              <span className="text-brand-500">ONGs, prefeituras e marcas</span>{" "}
              que cuidam de pets.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-700">
              Se você é abrigo, clínica em rede, distribuidora pet, app de
              transporte ou tem uma comunidade engajada, dá pra fazer mais junto
              do que separado. Conta pra gente o que tem em mente.
            </p>

            <ul className="mt-6 space-y-4">
              {beneficios.map((b) => (
                <li key={b.title} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                    <b.icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-ink-900">
                      {b.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-700">
                      {b.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Direita: form */}
          <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm sm:p-8">
            <ParceriaForm />
          </div>
        </div>
      </section>
    </>
  );
}
