import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserCircle2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { getMyProfile } from "@/lib/services/profiles";
import { PerfilForm } from "./PerfilForm";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    redirect("/login?next=/perfil");
  }

  const profile = await getMyProfile();
  if (!profile) {
    // Não deveria acontecer (trigger handle_new_user cria profile)
    return (
      <div className="min-h-screen bg-ink-800">
        <TopBar />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <p className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger-fg">
            Perfil não encontrado. Tente fazer logout e login de novo.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-800">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <Link
          href="/meus-pets"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <header className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/10">
            <UserCircle2 className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Meu perfil</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Como você aparece no SOS Pet.
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-white/10 bg-ink-700/70 p-5 backdrop-blur-sm sm:p-7">
          <PerfilForm profile={profile} email={user.email ?? ""} />
        </div>
      </main>
    </div>
  );
}
