"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { redirect } from "next/navigation";

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
  return createServiceClient();
}

export async function criarProdutoAction(formData: FormData) {
  const service = await assertAdmin();

  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const priceBrl = parseFloat(formData.get("price_brl") as string) || 0;
  const originalBrl = parseFloat(formData.get("original_price_brl") as string) || 0;
  const supplierName = (formData.get("supplier_name") as string | null)?.trim() || null;
  const category = (formData.get("category") as string) || "geral";
  const checkoutType = (formData.get("checkout_type") as string) || "external";
  const externalUrl = (formData.get("external_url") as string | null)?.trim() || null;
  const featured = formData.get("featured") === "true";
  const photo = formData.get("photo") as File | null;

  let photoUrl: string | null = null;
  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop() ?? "jpg";
    const path = `store/${Date.now()}.${ext}`;
    const { error } = await service.storage
      .from("pets")
      .upload(path, photo, { contentType: photo.type, upsert: false });
    if (!error) {
      const { data: urlData } = service.storage.from("pets").getPublicUrl(path);
      photoUrl = urlData.publicUrl;
    }
  }

  await service.from("store_products").insert({
    name,
    description,
    price_cents: Math.round(priceBrl * 100),
    original_price_cents: originalBrl > 0 ? Math.round(originalBrl * 100) : null,
    photo_url: photoUrl,
    supplier_name: supplierName,
    category,
    checkout_type: checkoutType,
    external_url: externalUrl,
    featured,
    active: true,
  });

  revalidatePath("/admin/loja");
  revalidatePath("/loja");
}

export async function toggleProdutoAction(formData: FormData) {
  const service = await assertAdmin();
  const id = formData.get("id") as string;
  const active = formData.get("active") === "true";

  await service.from("store_products").update({ active: !active }).eq("id", id);

  revalidatePath("/admin/loja");
  revalidatePath("/loja");
}

export async function deletarProdutoAction(formData: FormData) {
  const service = await assertAdmin();
  const id = formData.get("id") as string;

  await service.from("store_products").delete().eq("id", id);

  revalidatePath("/admin/loja");
  revalidatePath("/loja");
}

export async function atualizarOrdemAction(formData: FormData) {
  const service = await assertAdmin();
  const id = formData.get("id") as string;
  const sortOrder = parseInt(formData.get("sort_order") as string) || 0;

  await service.from("store_products").update({ sort_order: sortOrder }).eq("id", id);

  revalidatePath("/admin/loja");
  revalidatePath("/loja");
}
