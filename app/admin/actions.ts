"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import {
  notificarPrestadorAprovado,
  notificarPrestadorRejeitado,
  notificarParceiroAprovado,
  notificarParceiroRejeitado,
} from "@/lib/services/email";
import type { PrestadorRow, ParceiroRow } from "@/lib/types/database";

/**
 * Resultado padrão de toda Server Action admin.
 *
 * Por que existe: antes os actions retornavam `void`. Falha de RLS/DB ficava
 * silenciosa — UI mostrava "feito" sem ter feito. Agora todo action retorna
 * { ok, error? } para o caller poder mostrar feedback (e o servidor sempre
 * loga via console.error pra Vercel coletar).
 */
export interface AdminActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Wrapper de revalidate. Sempre revalida o sub-path E /admin (que mostra
 * counts agregados — antes ficava defasado até navegar de novo).
 */
function revalidateAdmin(subPath: string) {
  revalidatePath(subPath);
  revalidatePath("/admin");
}

/** Garante que o caller é admin antes de qualquer mutação. */
async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (data?.role !== "admin") redirect("/");
  return supabase;
}

// ─── Prestadores ──────────────────────────────────────────────

export async function aprovarPrestadorAction(
  prestadorId: string
): Promise<AdminActionResult> {
  const supabase = await assertAdmin();

  const { data: prestRaw } = await supabase
    .from("prestadores")
    .select("nome, slug, email")
    .eq("id", prestadorId)
    .maybeSingle();

  const { error } = await supabase
    .from("prestadores")
    .update({ status: "ativo" })
    .eq("id", prestadorId);

  if (error) {
    console.error("[aprovarPrestadorAction]", error);
    return { ok: false, error: error.message };
  }

  revalidateAdmin("/admin/prestadores");

  // Notificação email (best-effort)
  const prest = prestRaw as Pick<PrestadorRow, "nome" | "slug" | "email"> | null;
  if (prest?.email) {
    notificarPrestadorAprovado({
      email: prest.email,
      nome: prest.nome,
      nomeNegocio: prest.nome,
      slug: prest.slug,
    }).catch((e) =>
      console.error("[aprovarPrestadorAction] email falhou:", e)
    );
  }

  return { ok: true };
}

export async function rejeitarPrestadorAction(
  prestadorId: string
): Promise<AdminActionResult> {
  const supabase = await assertAdmin();

  const { data: prestRaw } = await supabase
    .from("prestadores")
    .select("nome, email")
    .eq("id", prestadorId)
    .maybeSingle();

  const { error } = await supabase
    .from("prestadores")
    .update({ status: "pausado" })
    .eq("id", prestadorId);

  if (error) {
    console.error("[rejeitarPrestadorAction]", error);
    return { ok: false, error: error.message };
  }

  revalidateAdmin("/admin/prestadores");

  // Notificação email (best-effort)
  const prest = prestRaw as Pick<PrestadorRow, "nome" | "email"> | null;
  if (prest?.email) {
    notificarPrestadorRejeitado({
      email: prest.email,
      nome: prest.nome,
      nomeNegocio: prest.nome,
    }).catch((e) =>
      console.error("[rejeitarPrestadorAction] email falhou:", e)
    );
  }

  return { ok: true };
}

// ─── Parceiros ────────────────────────────────────────────────

export async function aprovarParceiroAction(
  parceiroId: string
): Promise<AdminActionResult> {
  const supabase = await assertAdmin();

  const { data: parcRaw } = await supabase
    .from("parceiros")
    .select("nome, email, empresa")
    .eq("id", parceiroId)
    .maybeSingle();

  const { error } = await supabase
    .from("parceiros")
    .update({ status: "aprovado" })
    .eq("id", parceiroId);

  if (error) {
    console.error("[aprovarParceiroAction]", error);
    return { ok: false, error: error.message };
  }

  revalidateAdmin("/admin/parceiros");

  // Notificação email (best-effort)
  const parc = parcRaw as Pick<ParceiroRow, "nome" | "email" | "empresa"> | null;
  if (parc?.email) {
    notificarParceiroAprovado({
      email: parc.email,
      nome: parc.nome,
      empresa: parc.empresa,
    }).catch((e) =>
      console.error("[aprovarParceiroAction] email falhou:", e)
    );
  }

  return { ok: true };
}

export async function rejeitarParceiroAction(
  parceiroId: string
): Promise<AdminActionResult> {
  const supabase = await assertAdmin();

  const { data: parcRaw } = await supabase
    .from("parceiros")
    .select("nome, email, empresa")
    .eq("id", parceiroId)
    .maybeSingle();

  const { error } = await supabase
    .from("parceiros")
    .update({ status: "rejeitado" })
    .eq("id", parceiroId);

  if (error) {
    console.error("[rejeitarParceiroAction]", error);
    return { ok: false, error: error.message };
  }

  revalidateAdmin("/admin/parceiros");

  // Notificação email (best-effort)
  const parc = parcRaw as Pick<ParceiroRow, "nome" | "email" | "empresa"> | null;
  if (parc?.email) {
    notificarParceiroRejeitado({
      email: parc.email,
      nome: parc.nome,
      empresa: parc.empresa,
    }).catch((e) =>
      console.error("[rejeitarParceiroAction] email falhou:", e)
    );
  }

  return { ok: true };
}

// ─── Pets ─────────────────────────────────────────────────────

export async function removerPetAction(
  petId: string
): Promise<AdminActionResult> {
  const supabase = await assertAdmin();
  const { error } = await supabase
    .from("pets")
    .update({ status: "removed" })
    .eq("id", petId);

  if (error) {
    console.error("[removerPetAction]", error);
    return { ok: false, error: error.message };
  }
  revalidateAdmin("/admin/pets");
  return { ok: true };
}

export async function reativarPetAction(
  petId: string
): Promise<AdminActionResult> {
  const supabase = await assertAdmin();
  const { error } = await supabase
    .from("pets")
    .update({ status: "active" })
    .eq("id", petId);

  if (error) {
    console.error("[reativarPetAction]", error);
    return { ok: false, error: error.message };
  }
  revalidateAdmin("/admin/pets");
  return { ok: true };
}

// ─── Avistamentos ─────────────────────────────────────────────

export async function deletarAvistamentoAction(
  sightingId: string
): Promise<AdminActionResult> {
  const supabase = await assertAdmin();
  const { error } = await supabase
    .from("sightings")
    .delete()
    .eq("id", sightingId);

  if (error) {
    console.error("[deletarAvistamentoAction]", error);
    return { ok: false, error: error.message };
  }
  revalidateAdmin("/admin/avistamentos");
  return { ok: true };
}

