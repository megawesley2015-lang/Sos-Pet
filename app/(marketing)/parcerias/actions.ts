"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createParceiroSchema } from "@/lib/validation/parceiro";
import { parseFormData } from "@/lib/validation/auth";

export interface ParceiroState {
  ok?: boolean;
  errors?: Record<string, string>;
  message?: string;
  successName?: string;
}

export async function submitParceriaAction(
  _prev: ParceiroState,
  formData: FormData
): Promise<ParceiroState> {
  const parsed = parseFormData(createParceiroSchema, formData);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("parceiros").insert({
    nome: parsed.data.nome,
    email: parsed.data.email,
    empresa: parsed.data.empresa,
    mensagem: parsed.data.mensagem,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, successName: parsed.data.nome };
}
