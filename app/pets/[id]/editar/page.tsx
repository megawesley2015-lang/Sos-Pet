import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { getPetForOwner } from "@/lib/services/pets";
import { EditPetClient } from "./EditPetClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * /pets/[id]/editar — owner-only.
 * Middleware já redireciona pra /login se deslogado, mas re-checamos aqui
 * (defesa em profundidade). E garantimos que o user é dono do pet.
 */
export default async function EditarPetPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/pets/${id}/editar`)}`);
  }

  const pet = await getPetForOwner(id, user.id);
  if (!pet) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-ink-800">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <Link
          href={`/pets/${id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o pet
        </Link>

        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold">Editar registro</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Atualize as informações para acelerar o reencontro.
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-ink-700/70 p-5 backdrop-blur-sm sm:p-7">
          <EditPetClient pet={pet} />
        </div>
      </main>
    </div>
  );
}
