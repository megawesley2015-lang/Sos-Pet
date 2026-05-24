import Link from "next/link";
import { Clock, QrCode, Package, ArrowRight, RefreshCw } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";

export const metadata = {
  title: "Pagamento em processamento",
};

/**
 * /plaquinha/pendente
 *
 * Mercado Pago redireciona aqui quando o pagamento está pendente —
 * comum em Pix que ainda não foi pago e boleto bancário.
 *
 * O webhook /api/webhook/mercadopago atualiza o pedido automaticamente
 * assim que o pagamento for compensado (pode levar minutos a 3 dias úteis).
 *
 * Query params recebidos do MP (não usados na UI, mas úteis para debug):
 *   collection_id, collection_status=pending, external_reference, payment_id
 */
export default async function PlaquinhaPendentePage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string; payment_id?: string }>;
}) {
  const params = await searchParams;
  const petId = params.pet;

  return (
    <div data-theme="dark" className="min-h-screen bg-ink-900 text-fg">
      <TopBar />

      <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-16 text-center">
        {/* Ícone de pendente */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-amber-500/20 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-500/40">
            <Clock className="h-10 w-10 text-amber-400" strokeWidth={2} />
          </div>
        </div>

        <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">
          Aguardando pagamento
        </h1>
        <p className="mt-3 max-w-md text-fg-muted">
          Seu pedido foi criado, mas ainda não identificamos a confirmação do
          pagamento. Isso é normal para Pix e boleto bancário.
        </p>

        {/* Card informativo */}
        <div className="mt-8 w-full max-w-sm rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-400">
            O que acontece agora?
          </p>
          <ul className="space-y-2 text-sm text-fg-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-400">•</span>
              <span>
                <strong className="text-fg">Pix:</strong> a confirmação chega em
                poucos minutos após o pagamento.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-400">•</span>
              <span>
                <strong className="text-fg">Boleto:</strong> pode levar até{" "}
                <strong className="text-fg">3 dias úteis</strong> para compensar.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-400">•</span>
              <span>
                Assim que o pagamento for confirmado, você receberá um{" "}
                <strong className="text-fg">email de confirmação</strong> e a
                plaquinha entrará em produção automaticamente.
              </span>
            </li>
          </ul>
        </div>

        {/* Timeline */}
        <div className="mt-6 w-full max-w-sm rounded-2xl border border-white/10 bg-ink-700/40 p-6 text-left">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-fg-subtle">
            Progresso do pedido
          </p>
          <ol className="space-y-4">
            {[
              {
                icon: Clock,
                color: "text-amber-400",
                bg: "bg-amber-500/20",
                ring: "ring-amber-500/40",
                title: "Aguardando pagamento",
                desc: "Pedido criado. Confirmação pendente.",
                active: true,
              },
              {
                icon: QrCode,
                color: "text-fg-subtle",
                bg: "bg-ink-600/40",
                ring: "ring-white/10",
                title: "Produção da plaquinha",
                desc: "Após confirmação do pagamento.",
                active: false,
              },
              {
                icon: Package,
                color: "text-fg-subtle",
                bg: "bg-ink-600/40",
                ring: "ring-white/10",
                title: "Envio",
                desc: "Código de rastreio enviado por email.",
                active: false,
              },
            ].map((step) => (
              <li key={step.title} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${step.bg} ${step.ring}`}
                >
                  <step.icon
                    className={`h-4 w-4 ${step.color}`}
                    strokeWidth={2.5}
                  />
                </div>
                <div>
                  <p
                    className={`text-sm font-bold ${
                      step.active ? "text-amber-400" : "text-fg-subtle"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-fg-muted">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-6 flex items-center gap-1.5 text-sm text-fg-muted">
          <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
          Esta página não atualiza automaticamente — você receberá um email
          quando o pagamento for confirmado.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {petId ? (
            <Link
              href={`/pets/${petId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-glow-brand hover:bg-brand-400"
            >
              Ver perfil do pet
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          <Link
            href="/meus-pets"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-fg-muted hover:bg-white/5"
          >
            Meus pets
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-fg-muted hover:bg-white/5"
          >
            Ir para a home
          </Link>
        </div>
      </main>
    </div>
  );
}
