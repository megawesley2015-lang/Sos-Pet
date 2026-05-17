"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, Zap } from "lucide-react";

interface EmergencySafetyBannerProps {
  context?: "lost-pet" | "post-sos";
}

export function EmergencySafetyBanner({ context = "lost-pet" }: EmergencySafetyBannerProps) {
  const isPostSOS = context === "post-sos";

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 ${
      isPostSOS
        ? "border-brand-500/40 bg-gradient-to-br from-brand-500/15 to-brand-600/5"
        : "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-brand-500/5"
    }`}>
      {/* Detalhe de fundo */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/10 blur-2xl" />

      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          isPostSOS ? "bg-brand-500/20" : "bg-amber-500/20"
        }`}>
          <ShieldCheck className={`h-6 w-6 ${isPostSOS ? "text-brand-400" : "text-amber-400"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-fg text-sm">
            {isPostSOS
              ? "🚨 Previna que isso aconteça de novo"
              : "🛡️ Evite que seu pet se perca novamente"}
          </p>
          <p className="mt-1 text-xs text-fg-muted leading-relaxed">
            {isPostSOS
              ? "Uma medalha com QR Code faz qualquer pessoa que encontrar seu pet acessar seu contato imediatamente — sem precisar de internet."
              : "Com rastreador GPS e medalha QR Code, você localiza seu pet em minutos. Veja os produtos mais indicados pelos tutores."}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href="/loja?categoria=seguranca"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                isPostSOS
                  ? "bg-brand-500 text-white hover:bg-brand-400"
                  : "bg-amber-500 text-black hover:bg-amber-400"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Ver Kit de Segurança
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="text-[10px] text-fg-subtle">
              Entrega em até 7 dias úteis
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
