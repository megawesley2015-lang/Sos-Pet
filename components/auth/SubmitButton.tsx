"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { CTAButton } from "@/components/ui/CTAButton";
import type { ReactNode } from "react";

interface SubmitButtonProps {
  children: ReactNode;
  pendingLabel?: string;
}

/**
 * Botão submit que reage a useFormStatus do React 19.
 * Mostra spinner enquanto a Server Action está rodando.
 */
export function SubmitButton({ children, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <CTAButton
      type="submit"
      variant="primary"
      fullWidth
      disabled={pending}
      icon={pending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
    >
      {pending ? pendingLabel ?? "Enviando…" : children}
    </CTAButton>
  );
}
