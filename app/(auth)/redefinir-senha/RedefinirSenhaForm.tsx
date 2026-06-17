"use client";

import { useActionState } from "react";
import { FormField } from "@/components/auth/FormField";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initial: ResetPasswordState = {};

export function RedefinirSenhaForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initial);

  return (
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
  );
}
