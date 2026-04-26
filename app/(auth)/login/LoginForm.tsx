"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { FormField } from "@/components/auth/FormField";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

/**
 * Form de login client-side.
 * Separado do page.tsx pra que o useSearchParams() rode dentro de Suspense.
 *
 * Em Next 15, useSearchParams força "dynamic rendering" — sem Suspense ao
 * redor, o build falha em pages que tentam pre-render estaticamente.
 */
export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initial);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="next" value={next} />

      {state.message && <FormAlert type="error" message={state.message} />}

      <FormField
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        error={state.errors?.email}
      />

      <FormField
        name="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        required
        error={state.errors?.password}
      />

      <div className="-mt-2 mb-4 text-right text-xs">
        <Link href="/esqueci-senha" className="text-fg-muted hover:text-fg">
          Esqueci minha senha
        </Link>
      </div>

      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
    </form>
  );
}
