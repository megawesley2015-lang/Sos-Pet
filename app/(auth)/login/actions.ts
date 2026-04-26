"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, parseFormData } from "@/lib/validation/auth";

export interface LoginState {
  ok?: boolean;
  errors?: Record<string, string>;
  message?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = parseFormData(loginSchema, formData);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Mensagens do Supabase em inglês — traduzir as mais comuns
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login credentials")) {
      return { ok: false, message: "E-mail ou senha incorretos." };
    }
    if (msg.includes("email not confirmed")) {
      return {
        ok: false,
        message:
          "E-mail ainda não confirmado. Verifique sua caixa de entrada.",
      };
    }
    return { ok: false, message: error.message };
  }

  // Próxima rota: ?next=/algum-lugar (vinda do middleware) ou /pets default
  const next = (formData.get("next") as string | null) || "/pets";
  // redirect() joga um throw — não pode estar dentro de try/catch
  redirect(next.startsWith("/") ? next : "/pets");
}
