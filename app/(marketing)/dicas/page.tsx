import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  MapPin,
  MessageCircle,
  Search,
  Share2,
} from "lucide-react";
import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata = {
  title: "Dicas para encontrar seu pet — SOS Pet",
  description:
    "Guia rápido com o que fazer nas primeiras horas após perder um pet, como cadastrar bem e como aumentar suas chances de reencontro.",
};

const tips = [
  {
    icon: Camera,
    title: "Use a foto mais nítida que você tem",
    body: "Foto frontal, bem iluminada, mostrando o rosto do pet. Evite fotos antigas, com filtros ou em que ele esteja muito longe.",
  },
  {
    icon: MapPin,
    title: "Cadastre o local exato",
    body: "Bairro e cidade no app, mas também espalhe cartazes em raio de 1-2 km. A maioria dos pets fica perto de casa nos primeiros dias.",
  },
  {
    icon: MessageCircle,
    title: "Deixe um contato que você atende",
    body: "WhatsApp é melhor que telefone — quem encontra prefere mandar foto. Confira se o número tá certo antes de salvar.",
  },
  {
    icon: Share2,
    title: "Compartilhe agressivamente nas primeiras 24h",
    body: "Use o botão SOS pra gerar o cartaz e mande pros grupos do bairro, vizinhos, lojas, veterinários, ONGs e abrigos próximos.",
  },
  {
    icon: Search,
    title: "Procure pessoalmente cedo da manhã e à noite",
    body: "Pets perdidos costumam se mover quando há menos gente. Chame por ele com voz calma, leve algo cheiroso (petisco, ração).",
  },
  {
    icon: AlertTriangle,
    title: "Cuidado com golpes",
    body: "Quem pede dinheiro pra 'devolver' o pet sem mandar foto/vídeo provando que tá com ele provavelmente é golpe. Sempre exija prova de vida primeiro.",
  },
];

export default function DicasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Guia rápido"
        title="Dicas para reencontrar seu pet"
        description="Passos práticos pra aumentar suas chances de reencontro nas primeiras 48 horas — o período mais crítico."
      />

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <ul className="space-y-6">
            {tips.map((tip) => (
              <li
                key={tip.title}
                className="flex gap-4 rounded-2xl border border-warm-200 bg-white p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
                  <tip.icon className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink-900">
                    {tip.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-700">
                    {tip.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
            <h3 className="font-display text-lg font-bold text-ink-900">
              Pronto para começar?
            </h3>
            <p className="mt-1 text-sm text-ink-700">
              Cadastre seu pet em menos de 1 minuto.
            </p>
            <Link
              href="/pets/novo"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400"
            >
              Cadastrar agora
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
