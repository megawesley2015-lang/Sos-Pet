"use client";

import { useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { trackWhatsappClickAction } from "@/app/prestadores/[slug]/actions";
import { whatsappLink } from "@/lib/utils/format";

interface WhatsappButtonProps {
  prestadorId: string;
  phone: string;
  prestadorNome: string;
}

/**
 * Botão WhatsApp que incrementa stats antes de abrir o link.
 * O incremento roda em transition (não bloqueia o link) — o user vai pro WA
 * imediatamente, o counter atualiza em background.
 */
export function WhatsappButton({
  prestadorId,
  phone,
  prestadorNome,
}: WhatsappButtonProps) {
  const [, startTransition] = useTransition();
  const message = `Olá! Encontrei vocês pelo SOS Pet (${prestadorNome}) e gostaria de mais informações.`;
  const href = whatsappLink(phone, message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        startTransition(() => {
          trackWhatsappClickAction(prestadorId);
        });
      }}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400 active:scale-[0.98]"
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp
    </a>
  );
}
