import Link from "next/link";
import { CheckCircle, QrCode, Package, ArrowRight } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";

export const metadata = {
  title: "Pedido confirmado! — SOS Pet",
};

export default function PlaquinhaSucessoPage() {
  return (
    <div data-theme="dark" className="min-h-screen bg-ink-900 text-fg">
      <TopBar />

      <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-16 text-center">
        {/* Ícone de sucesso */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-green-500/20 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 ring-2 ring-green-500/40">
            <CheckCircle className="h-10 w-10 text-green-400" strokeWidth={2} />
          </div>
        </div>

        <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">
          Pedido confirmado! 🎉
        </h1>
        <p className="mt-3 max-w-md text-fg-muted">
          Pagamento aprovado. Vamos produzir a plaquinha do seu pet e enviar
          para o endereço cadastrado.
        </p>

        {/* Timeline */}
        <div className="mt-10 w-full max-w-sm rounded-2xl border border-white/10 bg-ink-700/40 p-6 text-left">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-fg-subtle">
            O que acontece agora
          </p>
          <ol className="space-y-4">
            {[
              {
                icon: CheckCircle,
                color: "text-green-400",
                bg: "bg-green-500/20",
                title: "Pagamento aprovado",
                desc: "Perfil digital do pet criado e ativo.",
                done: true,
              },
              {
                icon: QrCode,
                color: "text-brand-400",
                bg: "bg-brand-500/20",
                title: "Produção da plaquinha",
                desc: "Enviamos os dados ao fornecedor em breve.",
                done: false,
              },
              {
                icon: Package,
                color: "text-cyan-400",
                bg: "bg-cyan-500/20",
                title: "Envio",
                desc: "Você receberá o código de rastreio por email.",
                done: false,
              },
            ].map((step) => (
              <li key={step.title} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.bg}`}
                >
                  <step.icon
                    className={`h-4 w-4 ${step.color}`}
                    strokeWidth={2.5}
                  />
                </div>
                <div>
                  <p className={`text-sm font-bold ${step.done ? "text-green-400" : "text-fg"}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-fg-muted">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-6 text-sm text-fg-muted">
          📧 Enviamos um email de confirmação com o QR code do seu pet.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/pets"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-fg-muted hover:bg-white/5"
          >
            Ver pets na rede
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-glow-brand hover:bg-brand-400"
          >
            Ir para a home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
