"use client";

import { Check } from "lucide-react";

export type OnboardingStep = 1 | 2 | 3;

const STEPS: { label: string }[] = [
  { label: "Perfil" },
  { label: "Tipo de usuário" },
  { label: "Primeiro pet" },
];

type Props = {
  currentStep: OnboardingStep;
};

export function OnboardingProgress({ currentStep }: Props) {
  return (
    <nav aria-label="Progresso do cadastro" className="w-full">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const stepNumber = (index + 1) as OnboardingStep;
          const isCompleted = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;

          return (
            <li key={step.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-center">
                {index > 0 && (
                  <div
                    className={[
                      "h-0.5 flex-1 transition-colors",
                      isCompleted || isActive
                        ? "bg-[rgb(var(--color-primary))]"
                        : "bg-[rgb(var(--color-fg-subtle)/0.3)]",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                )}

                <div
                  className={[
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                    isCompleted
                      ? "border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))] text-white"
                      : isActive
                        ? "border-[rgb(var(--color-primary))] bg-transparent text-[rgb(var(--color-primary))]"
                        : "border-[rgb(var(--color-fg-subtle)/0.3)] bg-transparent text-[rgb(var(--color-fg-muted))]",
                  ].join(" ")}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    className={[
                      "h-0.5 flex-1 transition-colors",
                      isCompleted
                        ? "bg-[rgb(var(--color-primary))]"
                        : "bg-[rgb(var(--color-fg-subtle)/0.3)]",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                )}
              </div>

              <span
                className={[
                  "text-center text-[11px] font-medium leading-tight",
                  isActive
                    ? "text-[rgb(var(--color-fg))]"
                    : isCompleted
                      ? "text-[rgb(var(--color-primary))]"
                      : "text-[rgb(var(--color-fg-muted))]",
                ].join(" ")}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
