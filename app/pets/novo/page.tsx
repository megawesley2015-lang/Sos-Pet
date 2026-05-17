import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { PetForm } from "@/components/pets/PetForm";
import { createPetAction } from "./actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";

/**
 * /pets/novo — cadastro de pet (perdido ou encontrado).
 *
 * Não exige login (regra de negócio MVP). Quando logado, owner_id é
 * preenchido na Server Action e o pet aparece em /meus-pets.
 *
 * Mostra Turnstile para cadastros anônimos (anti-spam).
 */
export default async function NovoPetPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  const isAnonymous = !user;

  return (
    <div className="min-h-screen bg-ink-800">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <Link
          href="/pets"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold">
            Registrar{" "}
            <span className="text-brand-500 glow-text-brand">pet</span>
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Quanto mais informação, mais rápido o reencontro.
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-ink-700/70 p-5 backdrop-blur-sm sm:p-7">
          <PetForm
            action={createPetAction}
            submitLabel="Cadastrar pet"
            pendingLabel="Cadastrando…"
            showCaptcha={isAnonymous}
          />
        </div>
      </main>
    </div>
  );
}
