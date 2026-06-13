import { TopBar } from "@/components/layout/TopBar";
import { SentinelaForm } from "./SentinelaForm";
import { Camera, ShieldCheck, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cadastrar na Rede Sentinela",
  description:
    "Seja um ponto de apoio na Rede Sentinela do SOS Pet. Registre seu estabelecimento e ajude a localizar pets perdidos na sua região.",
};

const BENEFICIOS = [
  {
    icon: <MapPin className="h-5 w-5 text-brand-400" />,
    title: "Alfinete no mapa",
    desc: "Seu estabelecimento aparece no Mapa de Alertas como ponto de apoio para tutores.",
  },
  {
    icon: <Camera className="h-5 w-5 text-cyan-400" />,
    title: "Rede de vigilância colaborativa",
    desc: "Se um pet for avistado perto de você, tutores poderão entrar em contato.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-success" />,
    title: "Verificação gratuita",
    desc: "Sua participação é verificada pela nossa equipe. Nenhum custo ou assinatura.",
  },
];

export default function SentinelaNovoPage() {
  return (
    <div data-theme="light" className="min-h-screen bg-bg">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-500/40 bg-cyan-500/10 shadow-glow-cyan">
            <Camera className="h-6 w-6 text-cyan-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-fg">
            Rede <span className="text-cyan-400">Sentinela</span>
          </h1>
          <p className="mt-2 text-sm text-fg-muted max-w-md mx-auto">
            Junte-se à rede de estabelecimentos que colaboram com a busca de pets
            perdidos na Baixada Santista e região.
          </p>
        </div>

        {/* Benefícios */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-white/8 bg-ink-700/60 p-4"
            >
              <div className="mb-2">{b.icon}</div>
              <p className="text-sm font-semibold text-fg">{b.title}</p>
              <p className="mt-1 text-xs text-fg-muted">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Formulário */}
        <div className="rounded-2xl border border-white/10 bg-ink-700/80 p-6 backdrop-blur-sm">
          <h2 className="mb-6 font-display text-lg font-bold text-fg">
            Dados do estabelecimento
          </h2>
          <SentinelaForm />
        </div>

        {/* Rodapé info */}
        <p className="mt-6 text-center text-[11px] text-fg-subtle">
          📷 Câmeras são opcionais. Estabelecimentos sem câmeras também são bem-vindos
          como pontos de apoio para distribuição de cartazes e orientação a tutores.
        </p>
      </main>
    </div>
  );
}
