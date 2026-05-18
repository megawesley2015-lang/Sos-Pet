"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if ((profile as { role?: string } | null)?.role !== "admin") redirect("/");
  return createServiceClient();
}

export async function verificarSentinelaAction(id: string): Promise<void> {
  const supabase = await assertAdmin();
  await supabase.from("sentinel_partners").update({ verified: true }).eq("id", id);
  revalidatePath("/admin/sentinela");
  revalidatePath("/mapa");
}

export async function desativarSentinelaAction(id: string): Promise<void> {
  const supabase = await assertAdmin();
  await supabase.from("sentinel_partners").update({ is_active: false }).eq("id", id);
  revalidatePath("/admin/sentinela");
  revalidatePath("/mapa");
}

export async function reativarSentinelaAction(id: string): Promise<void> {
  const supabase = await assertAdmin();
  await supabase.from("sentinel_partners").update({ is_active: true }).eq("id", id);
  revalidatePath("/admin/sentinela");
  revalidatePath("/mapa");
}
