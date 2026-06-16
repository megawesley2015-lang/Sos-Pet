"use client";

import { Heart, Wrench } from "lucide-react";
import type { TipoUsuario } from "@/app/cadastro/OnboardingClient";

type Props = {
  onSelect: (tipo: TipoUsuario) => void;
  onSkip: () => void;
  isPending: boolean;
};

const OPCOES: { tipo: TipoUsuario; icon: React.ReactNode; titulo: string; descricao: string }[] = [
  {
    tipo: "tutor",
    icon: <Heart className="h-8 w-8" />,
    titulo: "Tutor de pet",
    descricao: "Quero encontrar ou cadastrar meu pet perdido.",
  },
  {
    tipo: "prestador",
    icon: <Wrench className="h-8 w-8" />,
    titulo: "Prestador de serviços",
    descricao: "Ofereço serviços como veterinário, pet shop ou adestrador.",
  },
];

export function StepTipoUsuario({ onSelect, onSkip, isPending }: Props) {
  return (
    <div>
      <p className="mb-6 text-sm text-[rgb(var(--color-fg-muted))]">
        Como você vai usar o SOS Pet Aumigo?
      </p>

      <div className="flex flex-col gap-4">
        {OPCOES.map(({ tipo, icon, titulo, descricao }) => (
          <button
            key={tipo}
            type="button"
            onClick={() => onSelect(tipo)}
            disabled={isPending}
            className="flex items-start gap-4 rounded-xl border border-[rgb(var(--color-fg-subtle)/0.3)] p-4 text-left transition-all hover:border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/0.05)] disabled:opacity-50"
          >
            <span className="mt-0.5 flex-shrink-0 text-[rgb(var(--color-primary))]">
              {icon}
            </span>
            <span>
              <span className="block text-sm font-bold text-[rgb(var(--color-fg))]">
                {titulo}
              </span>
              <span className="mt-0.5 block text-xs text-[rgb(var(--color-fg-muted))]">
                {descricao}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={onSkip}
          disabled={isPending}
          className="w-full rounded-xl border border-[rgb(var(--color-fg-subtle)/0.3)] px-6 py-3 text-sm font-medium text-[rgb(var(--color-fg-muted))] transition-colors hover:text-[rgb(var(--color-fg))] disabled:opacity-50"
        >
          Pular por agora
        </button>
      </div>
    </div>
  );
}
