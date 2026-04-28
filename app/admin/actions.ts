"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";

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
  await supabase
    .from("prestadores")
    .update({ status: "ativo" })
    .eq("id", prestadorId);
  revalidatePath("/admin/prestadores");
}

export async function rejeitarPrestadorAction(prestadorId: string) {
  const supabase = await assertAdmin();
  await supabase
    .from("prestadores")
    .update({ status: "pausado" })
    .eq("id", prestadorId);
  revalidatePath("/admin/prestadores");
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
  await supabase
    .from("pets")
    .update({ status: "removed" })
    .eq("id", petId);
  revalidatePath("/admin/pets");
}

export async function reativarPetAction(petId: string) {
  const supabase = await assertAdmin();
  await supabase
    .from("pets")
    .update({ status: "active" })
    .eq("id", petId);
  revalidatePath("/admin/pets");
}
