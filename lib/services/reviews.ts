/**
 * Service layer — avaliações de prestadores.
 *
 * Constraint UNIQUE(prestador_id, user_id) garante 1 avaliação por user
 * por prestador. INSERT duplicado vira upsert via onConflict.
 */
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import type { AvaliacaoRow } from "@/lib/types/database";

export interface ReviewWithAuthor extends AvaliacaoRow {
  author_name: string | null;
  author_avatar: string | null;
}

/**
 * Lista avaliações de um prestador com nome do autor.
 *
 * Nota técnica: usamos 2 queries em vez de embed do PostgREST porque o tipo
 * gerado pra select aninhado (`*, profiles:user_id(...)`) sai como `never`
 * sem o `Relationships` declarado na FK — não vale a complexidade no MVP.
 */
export const listReviewsByProvider = cache(async (
  prestadorId: string,
  limit = 30
): Promise<ReviewWithAuthor[]> => {
  const supabase = await createSupabaseServerClient();
  const { data: rowsRaw } = await supabase
    .from("avaliacoes")
    .select("*")
    .eq("prestador_id", prestadorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (rowsRaw as AvaliacaoRow[] | null) ?? [];
  if (rows.length === 0) return [];

  // Busca os profiles de quem avaliou em uma query única
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profilesRaw } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds);

  type ProfileLite = {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  const profiles = (profilesRaw as ProfileLite[] | null) ?? [];
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return rows.map((row) => {
    const profile = profileById.get(row.user_id);
    return {
      id: row.id,
      created_at: row.created_at,
      prestador_id: row.prestador_id,
      user_id: row.user_id,
      nota: row.nota,
      comentario: row.comentario,
      author_name: profile?.full_name ?? null,
      author_avatar: profile?.avatar_url ?? null,
    };
  });
});

/**
 * Avaliação que o user logado já fez deste prestador (se existir).
 * Usada pra preencher o form com a avaliação anterior (modo edit).
 */
export async function getMyReview(
  prestadorId: string
): Promise<AvaliacaoRow | null> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return null;
  const { data } = await supabase
    .from("avaliacoes")
    .select("*")
    .eq("prestador_id", prestadorId)
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as AvaliacaoRow | null) ?? null;
}

/**
 * Cria ou atualiza avaliação do user logado.
 * Constraint UNIQUE(prestador_id, user_id) → upsert via onConflict.
 */
export async function upsertReview(input: {
  prestador_id: string;
  nota: number;
  comentario: string | null;
}): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) {
    return { ok: false, error: "Você precisa estar logado para avaliar." };
  }

  const { error } = await supabase.from("avaliacoes").upsert(
    {
      prestador_id: input.prestador_id,
      user_id: user.id,
      nota: input.nota,
      comentario: input.comentario,
    },
    { onConflict: "prestador_id,user_id" }
  );

  return { ok: !error, error: error?.message ?? null };
}

export async function deleteReview(
  reviewId: string
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  // RLS faz o gate (só dono deleta)
  const { error } = await supabase
    .from("avaliacoes")
    .delete()
    .eq("id", reviewId);
  return { ok: !error, error: error?.message ?? null };
}
