import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Registrar pet",
  description: "Registre um pet perdido ou encontrado na Baixada Santista. Quanto mais informação, mais rápido o reencontro.",
};
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
 *
 * searchParams:
 *   ?kind=lost  → pré-seleciona "Perdi meu pet" (padrão)
 *   ?kind=found → pré-seleciona "Encontrei um pet"
 */
export default async function NovoPetPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const params = await searchParams;
  const defaultKind: "lost" | "found" =
    params.kind === "found" ? "found" : "lost";

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
            defaultKind={defaultKind}
          />
        </div>
      </main>
    </div>
  );
}
