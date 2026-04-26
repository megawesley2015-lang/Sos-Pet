"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { registerAction, type RegisterState } from "./actions";

const initial: RegisterState = {};

export default function RegistroPage() {
  const [state, formAction] = useActionState(registerAction, initial);

  if (state.ok && state.successEmail) {
    return (
      <AuthCard
        title="Confirme seu e-mail"
        subtitle="Quase lá! Falta só um passo."
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-500/60 bg-cyan-500/10 shadow-glow-cyan">
            <Mail className="h-6 w-6 text-cyan-300" />
          </div>
          <p className="text-sm text-fg">
            Mandamos um link de confirmação pra{" "}
            <span className="font-bold text-cyan-300">
              {state.successEmail}
            </span>
            .
          </p>
          <p className="mt-2 text-xs text-fg-muted">
            Abra o e-mail, clique no link e você cai logado direto na rede.
          </p>
          <p className="mt-4 text-xs text-fg-subtle">
            Não chegou? Confira a pasta de spam ou{" "}
            <Link
              href="/registro"
              className="text-cyan-400 hover:text-cyan-300"
            >
              tente outro e-mail
            </Link>
            .
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Em 30 segundos você já pode cadastrar e gerenciar pets."
      footer={
        <>
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-bold text-cyan-400 hover:text-cyan-300"
          >
            Entrar
          </Link>
        </>
      }
    >
      <form action={formAction} noValidate>
        {state.message && <FormAlert type="error" message={state.message} />}

        <FormField
          name="full_name"
          label="Seu nome"
          autoComplete="name"
          required
          error={state.errors?.full_name}
        />

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

        <SubmitButton pendingLabel="Criando conta…">Criar conta</SubmitButton>

        <p className="mt-4 text-center text-[11px] text-fg-subtle">
          Ao criar conta, você concorda com nossos{" "}
          <Link href="/termos" className="underline hover:text-fg-muted">
            Termos
          </Link>{" "}
          e{" "}
          <Link href="/privacidade" className="underline hover:text-fg-muted">
            Política de Privacidade
          </Link>
          .
        </p>
      </form>
    </AuthCard>
  );
}
