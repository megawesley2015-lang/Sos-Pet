import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { getProviderBySlug, getProviderForOwner } from "@/lib/services/providers";
import { EditPrestadorClient } from "./EditPrestadorClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditarPrestadorPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    redirect(`/login?next=/prestadores/${slug}/editar`);
  }

  // Busca via slug pra checar se existe, depois confirma ownership
  const prestador = await getProviderBySlug(slug);
  if (!prestador) notFound();

  const owned = await getProviderForOwner(prestador.id, user.id);
  if (!owned) notFound();

  return (
    <div className="min-h-screen bg-ink-800">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <Link
          href={`/prestadores/${slug}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold">Editar prestador</h1>
        </header>

        <div className="rounded-2xl border border-white/10 bg-ink-700/70 p-5 backdrop-blur-sm sm:p-7">
          <EditPrestadorClient prestador={owned} />
        </div>
      </main>
    </div>
  );
}
