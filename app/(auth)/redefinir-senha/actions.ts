"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  resetPasswordSchema,
  parseFormData,
} from "@/lib/validation/auth";
import { getUserSafe } from "@/lib/auth/safe";

export interface ResetPasswordState {
  ok?: boolean;
  errors?: Record<string, string>;
  message?: string;
}

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = parseFormData(resetPasswordSchema, formData);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  const supabase = await createSupabaseServerClient();

  // Garantia: a sessão de recovery precisa estar ativa (vinda do callback).
  // Sem isso, updateUser falha silencioso ou retorna erro.
  const user = await getUserSafe(supabase);
  if (!user) {
    return {
      ok: false,
      message:
        "Sessão expirada ou link inválido. Solicite um novo link de recuperação.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  redirect("/login?reset=ok");
}
