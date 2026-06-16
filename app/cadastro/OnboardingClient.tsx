"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OnboardingProgress, type OnboardingStep } from "@/components/onboarding/OnboardingProgress";
import { StepPerfil } from "@/components/onboarding/StepPerfil";
import { StepTipoUsuario } from "@/components/onboarding/StepTipoUsuario";
import { StepPrimeiroPet } from "@/components/onboarding/StepPrimeiroPet";
import { saveProfile, completarOnboarding } from "@/app/cadastro/actions";

export type TipoUsuario = "tutor" | "prestador" | null;

export function OnboardingClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSavePerfil(data: {
    full_name: string;
    phone: string;
    cidade: string;
  }) {
    setError(null);
    const result = await saveProfile(data);
    if (!result.success) {
      setError(result.error ?? "Erro ao salvar perfil.");
      return;
    }
    setStep(2);
  }

  function handleTipoUsuario(tipo: TipoUsuario) {
    setTipoUsuario(tipo);
    setStep(3);
  }

  async function handleSkip() {
    setError(null);
    await completarOnboarding();
    startTransition(() => {
      router.push("/achados-e-perdidos");
    });
  }

  async function handleConcluir() {
    setError(null);
    await completarOnboarding();
    startTransition(() => {
      router.push("/meus-pets");
    });
  }

  async function handlePetCadastrado() {
    await completarOnboarding();
    startTransition(() => {
      router.push("/meus-pets");
    });
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[rgb(var(--color-fg))]">
          Bem-vindo ao{" "}
          <span className="text-[rgb(var(--color-primary))]">SOS Pet Aumigo</span>
        </h1>
        <p className="mt-1 text-sm text-[rgb(var(--color-fg-muted))]">
          Vamos configurar sua conta em 3 passos rápidos.
        </p>
      </div>

      <div className="mb-8">
        <OnboardingProgress currentStep={step} />
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      {step === 1 && (
        <StepPerfil
          onSubmit={handleSavePerfil}
          onSkip={handleSkip}
          isPending={isPending}
        />
      )}

      {step === 2 && (
        <StepTipoUsuario
          onSelect={handleTipoUsuario}
          onSkip={handleSkip}
          isPending={isPending}
        />
      )}

      {step === 3 && (
        <StepPrimeiroPet
          tipoUsuario={tipoUsuario}
          onConcluir={handleConcluir}
          onPetCadastrado={handlePetCadastrado}
          onSkip={handleSkip}
          isPending={isPending}
        />
      )}
    </main>
  );
}
