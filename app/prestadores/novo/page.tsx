import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { PrestadorForm } from "@/components/providers/PrestadorForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { createProviderAction } from "./actions";

export default async function NovoPrestadorPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) {
    redirect("/login?next=/prestadores/novo");
  }

  return (
    <div className="min-h-screen bg-ink-800">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <Link
          href="/prestadores"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <header className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/10">
            <Building2 className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">
              Cadastrar{" "}
              <span className="text-cyan-400 glow-text-brand">prestador</span>
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              Apareça pra quem precisa de cuidado pro pet.
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-white/10 bg-ink-700/70 p-5 backdrop-blur-sm sm:p-7">
          <PrestadorForm
            action={createProviderAction}
            submitLabel="Cadastrar"
            pendingLabel="Cadastrando…"
          />
        </div>
      </main>
    </div>
  );
}
