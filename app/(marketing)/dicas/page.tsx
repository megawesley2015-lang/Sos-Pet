import Link from "next/link";
import { faqJsonLd } from "@/lib/utils/jsonld";
import { safeJsonLd } from "@/lib/utils/json-ld";

export const metadata = {
  title: "Dicas para encontrar seu pet",
  description:
    "Guia rápido com o que fazer nas primeiras horas após perder um pet, como cadastrar bem e como aumentar suas chances de reencontro.",
  alternates: { canonical: "/dicas" },
  openGraph: { url: "/dicas", type: "website" as const },
};

const steps = [
  {
    title: "Use a foto mais nítida que você tem",
    body: "Foto frontal, bem iluminada, mostrando o rosto do pet. Evite fotos antigas, com filtros ou em que ele esteja muito longe.",
  },
  {
    title: "Procure no entorno imediato",
    body: "Pets assustados costumam se esconder perto. Chame pelo nome com calma, leve petiscos e procure em garagens, vãos e quintais vizinhos.",
  },
  {
    title: "Avise a vizinhança",
    body: "Compartilhe o alerta nos grupos do bairro e com porteiros, feirantes e entregadores — eles circulam e enxergam muito.",
  },
  {
    title: "Cole cartazes com a foto",
    body: "Imprima o cartaz gerado pelo SOS Pet e cole em pontos de movimento perto de onde ele sumiu. Inclua um contato que você atende.",
  },
  {
    title: "Acompanhe os avistamentos",
    body: "Fique de olho no feed e no mapa. Quando alguém avistar um pet parecido, dá pra confirmar se é o seu.",
  },
  {
    title: "Cuidado com golpes",
    body: "Quem pede dinheiro pra 'devolver' o pet sem mandar foto/vídeo provando que está com ele provavelmente é golpe. Sempre exija prova de vida primeiro.",
  },
];

const faqs = [
  {
    question: "É realmente gratuito?",
    answer:
      "Sim. Cadastrar e procurar pets é 100% gratuito para tutores. A plataforma se mantém com prestadores parceiros e produtos, nunca cobrando de quem está em pânico.",
  },
  {
    question: "Preciso criar conta?",
    answer:
      "Não para buscar. Para cadastrar um pet você só precisa de um contato válido — sem login obrigatório e sem burocracia.",
  },
  {
    question: "Meu telefone fica exposto?",
    answer:
      "Não na listagem. Seu contato só aparece na página individual do pet, para quem realmente clicar pra ajudar. Você está sempre no controle.",
  },
  {
    question: "Achei um pet, e agora?",
    answer:
      "Cadastre como 'encontrado', deixe-o seguro com água e abrigo, e aguarde o cruzamento com os pets perdidos. Nunca exija recompensa.",
  },
];

const faqSchema = faqJsonLd(faqs);

export default function DicasPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }} />
      <header className="px-4 pb-2 pt-14 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-[clamp(30px,4vw,44px)] font-extrabold tracking-tight text-fg">
            Perdeu ou achou um pet? <span className="text-brand-500">Aja rápido.</span>
          </h1>
          <p className="mx-auto mt-2.5 max-w-[560px] text-fg-muted">
            As primeiras horas são as mais importantes. Siga os passos abaixo pra aumentar as chances de reencontro.
          </p>
        </div>
      </header>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          {/* Guia em passos numerados */}
          <ul className="space-y-4">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-2xl border border-warm-200 bg-white p-5 shadow-warm-card transition-[transform,box-shadow] duration-300 hover:shadow-warm-hover motion-safe:hover:-translate-y-0.5"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-brand-500/30 bg-[#FFF4E8] font-display text-xl font-extrabold text-brand-text">
                  {i + 1}
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-fg">{step.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* CTA band */}
          <div className="mt-12 rounded-3xl border border-warm-200 bg-gradient-to-br from-warm-200 to-white p-10 text-center shadow-warm-card">
            <h3 className="font-display text-2xl font-black text-fg">Não perca tempo. 🆘</h3>
            <p className="mt-2 text-fg-muted">Cadastre seu pet perdido agora e ative a rede da Baixada.</p>
            <Link
              href="/achados-e-perdidos/cadastrar"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-brand-400"
            >
              Cadastrar pet perdido
            </Link>
          </div>

          {/* FAQ */}
          <div className="mt-16">
            <h2 className="text-center font-display text-2xl font-bold text-fg">Perguntas frequentes</h2>
            <div className="mx-auto mt-6 space-y-2.5">
              {faqs.map((faq, i) => (
                <details
                  key={faq.question}
                  open={i === 0}
                  className="group rounded-2xl border border-warm-200 bg-white px-5 py-4 shadow-warm-card"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-fg">
                    {faq.question}
                    <span className="text-xl text-brand-600 group-open:hidden" aria-hidden="true">+</span>
                    <span className="hidden text-xl text-brand-600 group-open:inline" aria-hidden="true">−</span>
                  </summary>
                  <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
