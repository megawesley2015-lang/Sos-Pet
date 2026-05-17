"use client";

import { Crown, Check, ArrowRight, Zap } from "lucide-react";

interface ClubSOSBannerProps {
  mercadoPagoLink?: string;
}

const BENEFITS = [
  "Frete grátis em todos os produtos da loja",
  "Alertas de vacinas e medicamentos por WhatsApp",
  "Badge exclusivo 'Membro Clube' no perfil",
  "Prioridade no suporte via WhatsApp",
  "Desconto de 15% em agendamentos com prestadores parceiros",
];

export function ClubSOSBanner({ mercadoPagoLink }: ClubSOSBannerProps) {
  const checkoutUrl =
    mercadoPagoLink ||
    process.env.NEXT_PUBLIC_CLUBE_SOS_MP_LINK ||
    "#clube-sos";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-brand-500/5 to-ink-700/80 p-6">
      {/* Fundo decorativo */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-yellow-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 left-0 h-32 w-32 rounded-full bg-brand-500/10 blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/20 border border-yellow-500/30">
            <Crown className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <p className="font-display text-lg font-black text-fg">
              Clube SOS{" "}
              <span className="text-yellow-400">Premium</span>
            </p>
            <p className="text-xs text-fg-muted">Tudo que seu pet precisa, reunido</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-display text-2xl font-black text-yellow-400">R$&nbsp;29</p>
            <p className="text-[10px] text-fg-muted">/mês</p>
          </div>
        </div>

        {/* Benefícios */}
        <ul className="space-y-2 mb-5">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm text-fg-muted">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400 py-3 text-sm font-black text-black shadow-lg shadow-yellow-500/30 transition hover:from-yellow-400 hover:to-yellow-300 active:scale-[0.98]"
        >
          <Zap className="h-4 w-4" />
          Assinar agora — R$ 29/mês
          <ArrowRight className="h-4 w-4" />
        </a>

        {/* Nota de ativação */}
        <p className="mt-3 text-center text-[11px] text-fg-subtle">
          🔒 Pagamento seguro via Mercado Pago (PIX, Cartão, Boleto) •{" "}
          <span className="text-fg-muted">Acesso ativado em até 24h após confirmação</span>
        </p>
      </div>
    </div>
  );
}
