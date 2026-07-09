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
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#20B2AA]/40 bg-[#E1F5EE] px-5 py-3 text-sm font-bold text-[#0F6E56] transition-all hover:bg-[#d3efe7] active:scale-[0.98]"
    >
      <Phone className="h-4 w-4" />
      Ligar
    </a>
  );
}
