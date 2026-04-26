"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  forgotPasswordAction,
  type ForgotPasswordState,
} from "./actions";

const initial: ForgotPasswordState = {};

export default function EsqueciSenhaPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, initial);

  if (state.ok && state.successEmail) {
    return (
      <AuthCard
        title="Verifique seu e-mail"
        subtitle="Se a conta existir, mandamos um link de recuperação."
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-500/60 bg-cyan-500/10 shadow-glow-cyan">
            <Mail className="h-6 w-6 text-cyan-300" />
          </div>
          <p className="text-sm text-fg">
            Enviamos para{" "}
            <span className="font-bold text-cyan-300">
              {state.successEmail}
            </span>
            .
          </p>
          <p className="mt-2 text-xs text-fg-muted">
            O link expira em 1 hora. Se não chegar, confira a pasta de spam.
          </p>
          <p className="mt-4">
            <Link
              href="/login"
              className="text-xs text-fg-muted hover:text-fg"
            >
              ← Voltar para o login
            </Link>
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Te mandamos um link para redefinir."
      footer={
        <Link href="/login" className="text-fg-muted hover:text-fg">
          ← Voltar para o login
        </Link>
      }
    >
      <form action={formAction} noValidate>
        {state.message && <FormAlert type="error" message={state.message} />}
        <FormField
          name="email"
          label="E-mail da conta"
          type="email"
          autoComplete="email"
          required
          error={state.errors?.email}
        />
        <SubmitButton pendingLabel="Enviando…">Enviar link</SubmitButton>
      </form>
    </AuthCard>
  );
}
