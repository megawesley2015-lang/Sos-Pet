import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { AuthCard } from "@/components/auth/AuthCard";
import { RedefinirSenhaForm } from "./RedefinirSenhaForm";

/**
 * /redefinir-senha — Server Component.
 *
 * Valida que existe uma sessão de recuperação ativa ANTES de mostrar o form.
 * O callback (/auth/callback) troca o code por uma sessão; se o usuário cair
 * aqui sem passar por esse fluxo (link expirado, acesso direto), não há sessão
 * e exibimos um estado claro em vez de deixá-lo preencher um form que falharia
 * só no submit.
 */
export default async function RedefinirSenhaPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    return (
      <AuthCard
        title="Link inválido ou expirado"
        subtitle="Não encontramos uma sessão de recuperação ativa."
        footer={
          <Link href="/login" className="text-fg-muted hover:text-fg">
            ← Voltar para o login
          </Link>
        }
      >
        <p className="text-sm text-fg-muted">
          O link pode ter expirado ou já ter sido usado. Solicite um novo para
          redefinir sua senha.
        </p>
        <Link
          href="/esqueci-senha"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-400"
        >
          Solicitar novo link
        </Link>
      </AuthCard>
    );
  }

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
      <RedefinirSenhaForm />
    </AuthCard>
  );
}
