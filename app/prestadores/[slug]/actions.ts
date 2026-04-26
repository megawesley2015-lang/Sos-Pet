"use server";

import { revalidatePath } from "next/cache";
import {
  incrementWhatsappClick,
  incrementPhoneClick,
} from "@/lib/services/providers";
import { upsertReview, deleteReview } from "@/lib/services/reviews";
import { createReviewSchema } from "@/lib/validation/review";
import { parseFormData } from "@/lib/validation/auth";

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
  await deleteReview(reviewId);
  revalidatePath(`/prestadores/${slug}`);
}
