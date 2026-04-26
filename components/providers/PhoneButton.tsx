"use client";

import { useTransition } from "react";
import { Phone } from "lucide-react";
import { trackPhoneClickAction } from "@/app/prestadores/[slug]/actions";

interface PhoneButtonProps {
  prestadorId: string;
  phone: string;
}

export function PhoneButton({ prestadorId, phone }: PhoneButtonProps) {
  const [, startTransition] = useTransition();
  return (
    <a
      href={`tel:${phone.replace(/\D/g, "")}`}
      onClick={() => {
        startTransition(() => {
          trackPhoneClickAction(prestadorId);
        });
      }}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/60 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-200 transition-all hover:bg-cyan-500/20 hover:shadow-glow-cyan active:scale-[0.98]"
    >
      <Phone className="h-4 w-4" />
      Ligar
    </a>
  );
}
