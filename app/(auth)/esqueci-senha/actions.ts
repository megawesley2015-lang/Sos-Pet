"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  parseFormData,
} from "@/lib/validation/auth";
import { getBaseUrl } from "@/lib/utils/url";

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
  // Usamos o callback padrão com next=/redefinir-senha. 
  // O Supabase adicionará o 'code' automaticamente.
  // type=recovery garante detecção no callback mesmo sem allowlist do Supabase
  // Configurar também: Authentication > URL Configuration > Redirect URLs
  //   Adicionar: http://localhost:3000/** (dev) e https://seu-dominio.vercel.app/** (prod)
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${getBaseUrl()}/auth/callback?type=recovery&next=/redefinir-senha` }
  );

  // Por segurança (anti-enum), respondemos sucesso mesmo se o email não existir.
  // Logamos o erro só em dev pra debug.
  if (error && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn("[forgot-password]", error.message);
  }

  return { ok: true, successEmail: parsed.data.email };
}
