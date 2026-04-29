"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import {
  notificarPrestadorAprovado,
  notificarPrestadorRejeitado,
} from "@/lib/services/email";
import type { PrestadorRow } from "@/lib/types/database";

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

export async function aprovarPrestadorAction(prestadorId: string) {
  const supabase = await assertAdmin();

  const { data: prestRaw } = await supabase
    .from("prestadores")
    .select("nome, slug, email")
    .eq("id", prestadorId)
    .maybeSingle();

  await supabase
    .from("prestadores")
    .update({ status: "ativo" })
    .eq("id", prestadorId);

  revalidatePath("/admin/prestadores");

  // Notificação email (best-effort)
  const prest = prestRaw as Pick<PrestadorRow, "nome" | "slug" | "email"> | null;
  if (prest?.email) {
    notificarPrestadorAprovado({
      email: prest.email,
      nome: prest.nome,
      nomeNegocio: prest.nome,
      slug: prest.slug,
    }).catch(console.error);
  }
}

export async function rejeitarPrestadorAction(prestadorId: string) {
  const supabase = await assertAdmin();

  const { data: prestRaw } = await supabase
    .from("prestadores")
    .select("nome, email")
    .eq("id", prestadorId)
    .maybeSingle();

  await supabase
    .from("prestadores")
    .update({ status: "pausado" })
    .eq("id", prestadorId);

  revalidatePath("/admin/prestadores");

  // Notificação email (best-effort)
  const prest = prestRaw as Pick<PrestadorRow, "nome" | "email"> | null;
  if (prest?.email) {
    notificarPrestadorRejeitado({
      email: prest.email,
      nome: prest.nome,
      nomeNegocio: prest.nome,
    }).catch(console.error);
  }
}

// ─── Parceiros ────────────────────────────────────────────────

export async function aprovarParceiroAction(parceiroId: string) {
  const supabase = await assertAdmin();
  await supabase
    .from("parceiros")
    .update({ status: "aprovado" })
    .eq("id", parceiroId);
  revalidatePath("/admin/parceiros");
}

export async function rejeitarParceiroAction(parceiroId: string) {
  const supabase = await assertAdmin();
  await supabase
    .from("parceiros")
    .update({ status: "rejeitado" })
    .eq("id", parceiroId);
  revalidatePath("/admin/parceiros");
}

// ─── Pets ─────────────────────────────────────────────────────

export async function removerPetAction(petId: string) {
  const supabase = await assertAdmin();
  await supabase.from("pets").update({ status: "removed" }).eq("id", petId);
  revalidatePath("/admin/pets");
}

export async function reativarPetAction(petId: string) {
  const supabase = await assertAdmin();
  await supabase.from("pets").update({ status: "active" }).eq("id", petId);
  revalidatePath("/admin/pets");
}

// ─── Avistamentos ─────────────────────────────────────────────

export async function deletarAvistamentoAction(sightingId: string) {
  const supabase = await assertAdmin();
  await supabase.from("sightings").delete().eq("id", sightingId);
  revalidatePath("/admin/avistamentos");
}

