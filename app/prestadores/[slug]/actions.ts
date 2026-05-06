"use server";

import { revalidatePath } from "next/cache";
import {
  incrementWhatsappClick,
  incrementPhoneClick,
} from "@/lib/services/providers";
import { upsertReview, deleteReview } from "@/lib/services/reviews";
import { createReviewSchema } from "@/lib/validation/review";
import { parseFormData } from "@/lib/validation/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";

/**
 * Server Action chamada quando o user clica no botão WhatsApp.
 * Não bloqueia a navegação — incrementa em background e retorna void.
 */
export async function trackWhatsappClickAction(prestadorId: string): Promise<void> {
  await incrementWhatsappClick(prestadorId);
}

export async function trackPhoneClickAction(prestadorId: string): Promise<void> {
  await incrementPhoneClick(prestadorId);
}

// ----- Avaliação -----

export interface ReviewState {
  ok?: boolean;
  errors?: Record<string, string>;
  message?: string;
}

export async function submitReviewAction(
  slug: string,
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const parsed = parseFormData(createReviewSchema, formData);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  const { ok, error } = await upsertReview({
    prestador_id: parsed.data.prestador_id,
    nota: parsed.data.nota,
    comentario: parsed.data.comentario,
  });

  if (!ok) {
    return { ok: false, message: error ?? "Erro ao salvar avaliação." };
  }

  revalidatePath(`/prestadores/${slug}`);
  return { ok: true, message: "Avaliação registrada!" };
}

export async function deleteReviewAction(
  reviewId: string,
  slug: string
): Promise<void> {
  // Verifica propriedade antes de deletar — defesa em profundidade além do RLS
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return;

  const { data } = await supabase
    .from("avaliacoes")
    .select("user_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (!data || data.user_id !== user.id) return;

  await deleteReview(reviewId);
  revalidatePath(`/prestadores/${slug}`);
}
