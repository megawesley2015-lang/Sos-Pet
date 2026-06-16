import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingClient } from "@/app/cadastro/OnboardingClient";

export const metadata: Metadata = {
  title: "Configurar conta — SOS Pet Aumigo",
  description: "Configure seu perfil e cadastre seu primeiro pet na plataforma.",
};

export const dynamic = "force-dynamic";

/**
 * /cadastro — Onboarding pós-registro.
 *
 * Verifica se o usuário está autenticado. Se não estiver, redireciona para /login.
 * Se o onboarding já foi concluído, redireciona para /meus-pets.
 */
export default async function CadastroPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, onboarding_completed")
    .eq("id", user.id)
    .single();

  // Se onboarding já foi concluído, redireciona para meus pets
  if (profile?.onboarding_completed === true) {
    redirect("/meus-pets");
  }

  return <OnboardingClient />;
}
