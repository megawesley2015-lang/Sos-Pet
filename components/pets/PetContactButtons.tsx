"use client";

import { MessageCircle, Phone } from "lucide-react";
import { CTAButton } from "@/components/ui/CTAButton";
import { trackPetContactClick } from "@/lib/analytics/cartaz-funnel";

interface PetContactButtonsProps {
  petId: string;
  src?: string;
  whatsappHref?: string | null;
  phoneHref: string;
}

export function PetContactButtons({
  petId,
  src,
  whatsappHref,
  phoneHref,
}: PetContactButtonsProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {whatsappHref && (
        <span
          onClick={() => trackPetContactClick(petId, "whatsapp", src)}
        >
          <CTAButton
            href={whatsappHref}
            variant="primary"
            icon={<MessageCircle className="h-4 w-4" />}
          >
            WhatsApp
          </CTAButton>
        </span>
      )}
      <span
        onClick={() => trackPetContactClick(petId, "call", src)}
      >
        <CTAButton
          href={phoneHref}
          variant="secondary"
          icon={<Phone className="h-4 w-4" />}
        >
          Ligar
        </CTAButton>
      </span>
    </div>
  );
}
