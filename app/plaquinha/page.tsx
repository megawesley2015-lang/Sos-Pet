import { TopBar } from "@/components/layout/TopBar";
import { CheckoutForm } from "./CheckoutForm";
import { ShieldCheck, Truck, QrCode, Siren } from "lucide-react";

export const metadata = {
  title: "Plaquinha de Identificação — SOS Pet",
  description:
    "Garanta a segurança do seu pet com uma plaquinha personalizada com QR code. Em caso de perda, qualquer pessoa pode escanear e entrar em contato com você.",
};

const FEATURES = [
  {
    icon: QrCode,
    title: "QR code único",
    desc: "Qualquer celular consegue escanear — abre o perfil do pet com seus dados de contato.",
  },
  {
    icon: Truck,
    title: "Frete incluso",
    desc: "Entregamos em todo o Brasil. Prazo médio de 7 a 14 dias úteis.",
  },
  {
    icon: ShieldCheck,
    title: "Perfil digital vitalício",
    desc: "O QR leva para o perfil do seu pet no SOS Pet, que você pode atualizar a qualquer hora.",
  },
  {
    icon: Siren,
    title: "Rede de resgate",
    desc: "Além da plaquinha, seu pet fica visível na rede colaborativa de achados e perdidos.",
  },
];

export default function PlaquinhaPage() {
  return (
    <div
      data-theme="dark"
      className="min-h-screen bg-ink-900 text-fg"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(255,107,53,0.08), transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,229,255,0.06), transparent 50%)",
      }}
    >
      <TopBar />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-300">
            <QrCode className="h-3 w-3" />
            Identidade digital para o seu pet
          </span>
          <h1 className="mt-4 font-display text-3xl font-black leading-tight sm:text-4xl">
            Plaquinha com{" "}
            <span className="text-brand-500 glow-text-brand">QR code</span>
            <br />
            que salva vidas.
          </h1>
          <p className="mt-3 text-fg-muted">
            Personalizamos com o nome e telefone do seu pet. Escaneou →
            aparece o perfil completo com foto e seu contato.
          </p>

          {/* Preço */}
          <div className="mt-6 inline-flex items-baseline gap-1">
            <span className="text-sm text-fg-subtle">R$</span>
            <span className="font-display text-5xl font-black text-fg">
              {(39.9).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="ml-2 rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-300">
              frete grátis
            </span>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          {/* Esquerda — benefícios */}
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-white/10 bg-ink-700/50 p-5"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
                    <f.icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <h3 className="font-display text-sm font-bold text-fg">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Exemplo do QR */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-700/40 p-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-fg-subtle">
                Como funciona
              </p>
              <ol className="space-y-3 text-sm text-fg-muted">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-300">
                    1
                  </span>
                  Você preenche os dados e paga — o perfil digital é criado na hora.
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-300">
                    2
                  </span>
                  Produzimos a plaquinha com nome, telefone e QR code único.
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-300">
                    3
                  </span>
                  Enviamos para sua casa. Coloque no coleirão e fique tranquilo.
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                    4
                  </span>
                  Alguém encontrou? Escaneia o QR → vê o perfil → te liga. Em segundos.
                </li>
              </ol>
            </div>
          </div>

          {/* Direita — formulário */}
          <div className="rounded-2xl border border-white/10 bg-ink-800/80 p-6 shadow-card-dark backdrop-blur-sm sm:p-8">
            <CheckoutForm />
          </div>
        </div>
      </main>
    </div>
  );
}
