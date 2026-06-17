"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { FormAlert } from "@/components/auth/FormAlert";
import { createClient } from "@/lib/supabase/client";
import { CTAButton } from "@/components/ui/CTAButton";
import { Loader2 } from "lucide-react";

export default function EsqueciSenhaPage() {
  const [pending, setPending] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Informe um e-mail válido.");
      return;
    }

    setPending(true);
    setError(null);

    const supabase = createClient();
    // Chama do browser: PKCE verifier fica em cookie acessível ao /auth/callback
    const { error: sbError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/redefinir-senha`,
    });

    setPending(false);

    if (sbError) {
      console.warn("[forgot-password]", sbError.message);
    }

    // Anti-enum: sempre mostra sucesso independente de o email existir
    setSuccessEmail(email);
  }

  if (successEmail) {
    return (
      <AuthCard
        title="Verifique seu e-mail"
        subtitle="Se a conta existir, mandamos um link de recuperação."
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand-500/60 bg-brand-500/10 shadow-glow-brand">
            <Mail className="h-6 w-6 text-brand-600" />
          </div>
          <p className="text-sm text-fg">
            Enviamos para{" "}
            <span className="font-bold text-brand-600">{successEmail}</span>.
          </p>
          <p className="mt-2 text-xs text-fg-muted">
            O link expira em 1 hora. Se não chegar, confira a pasta de spam.
          </p>
          <p className="mt-4">
            <Link href="/login" className="text-xs text-fg-muted hover:text-fg">
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
      <form onSubmit={handleSubmit} noValidate>
        {error && <FormAlert type="error" message={error} />}
        <FormField
          name="email"
          label="E-mail da conta"
          type="email"
          autoComplete="email"
          required
        />
        <CTAButton
          type="submit"
          variant="primary"
          fullWidth
          disabled={pending}
          icon={pending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
        >
          {pending ? "Enviando…" : "Enviar link"}
        </CTAButton>
      </form>
    </AuthCard>
  );
}
