"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

interface SaveProfileInput {
  full_name: string;
  phone: string;
  cidade: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Salva dados de perfil do usuário autenticado.
 * Os campos estão na tabela `profiles`, que é sincronizada com auth.users.
 */
export async function saveProfile(data: SaveProfileInput): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name.trim(),
      phone: data.phone.trim(),
      cidade: data.cidade.trim(),
    } as { full_name: string; phone: string; cidade: string })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Erro ao salvar perfil. Tente novamente." };
  }

  return { success: true };
}

/**
 * Marca o onboarding como concluído para o usuário autenticado.
 */
export async function completarOnboarding(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true } as { onboarding_completed: boolean })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Erro ao finalizar onboarding." };
  }

  return { success: true };
}
