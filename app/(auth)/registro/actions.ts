"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registerSchema, parseFormData } from "@/lib/validation/auth";
import { authCallbackUrl } from "@/lib/utils/url";

export interface RegisterState {
  ok?: boolean;
  errors?: Record<string, string>;
  message?: string;
  successEmail?: string; // se preenchido, mostramos tela de "verifique seu email"
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = parseFormData(registerSchema, formData);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      // Onde o link de confirmação volta. authCallbackUrl resolve dev/preview/prod.
      emailRedirectTo: authCallbackUrl("/pets"),
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return {
        ok: false,
        message: "Este e-mail já está cadastrado. Tente entrar.",
      };
    }
    if (msg.includes("password")) {
      return { ok: false, errors: { password: error.message } };
    }
    return { ok: false, message: error.message };
  }

  return { ok: true, successEmail: parsed.data.email };
}
