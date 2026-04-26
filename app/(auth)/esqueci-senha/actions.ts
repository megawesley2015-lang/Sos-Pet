"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  parseFormData,
} from "@/lib/validation/auth";
import { authCallbackUrl } from "@/lib/utils/url";

export interface ForgotPasswordState {
  ok?: boolean;
  errors?: Record<string, string>;
  message?: string;
  successEmail?: string;
}

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = parseFormData(forgotPasswordSchema, formData);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  const supabase = await createSupabaseServerClient();
  // O link do Supabase chama nosso /auth/callback com type=recovery,
  // que troca o code e nos manda pra /redefinir-senha.
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: authCallbackUrl("/redefinir-senha") }
  );

  // Por segurança (anti-enum), respondemos sucesso mesmo se o email não existir.
  // Logamos o erro só em dev pra debug.
  if (error && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn("[forgot-password]", error.message);
  }

  return { ok: true, successEmail: parsed.data.email };
}
