"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "./actions";

const initial: ResetPasswordState = {};

export default function RedefinirSenhaPage() {
  const [state, formAction] = useActionState(resetPasswordAction, initial);

  return (
    <AuthCard
      title="Nova senha"
      subtitle="Defina uma nova senha para sua conta."
      footer={
        <Link href="/login" className="text-fg-muted hover:text-fg">
          ← Voltar para o login
        </Link>
      }
    >
      <form action={formAction} noValidate>
        {state.message && <FormAlert type="error" message={state.message} />}

        <FormField
          name="password"
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          required
          error={state.errors?.password}
          hint="Mínimo de 8 caracteres."
        />

        <FormField
          name="confirm"
          label="Confirme a senha"
          type="password"
          autoComplete="new-password"
          required
          error={state.errors?.confirm}
        />

        <SubmitButton pendingLabel="Salvando…">Salvar nova senha</SubmitButton>
      </form>
    </AuthCard>
  );
}
