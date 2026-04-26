import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "./LoginForm";

/**
 * /login — Server Component wrapper.
 *
 * O LoginForm usa useSearchParams() (precisa Suspense em Next 15+).
 * Aqui só montamos o card e envolvemos o form em Suspense.
 */
export default function LoginPage() {
  return (
    <AuthCard
      title="Entrar"
      subtitle="Acesse sua conta para gerenciar seus registros."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link
            href="/registro"
            className="font-bold text-cyan-400 hover:text-cyan-300"
          >
            Criar conta
          </Link>
        </>
      }
    >
      <Suspense
        fallback={<div className="h-72 animate-pulse rounded-lg bg-ink-800/40" />}
      >
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
