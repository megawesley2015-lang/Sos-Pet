"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { parseFormData } from "@/lib/validation/auth";
import { storeProductSchema } from "@/lib/validation/store";
import { redirect } from "next/navigation";
import { syncPrintfulCatalog } from "@/lib/services/printful";

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

  const parsed = parseFormData(storeProductSchema, formData);
  if (!parsed.ok) {
    throw new Error(Object.values(parsed.errors).join(" | "));
  }
  const {
    name,
    description,
    price_brl,
    original_price_brl,
    supplier_name,
    category,
    checkout_type,
    external_url,
    featured,
  } = parsed.data;
  const photo = formData.get("photo") as File | null;

  let photoUrl: string | null = null;
  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop() ?? "jpg";
    const path = `store/${Date.now()}.${ext}`;
    const { error } = await service.storage
      .from("store-products")
      .upload(path, photo, { contentType: photo.type, upsert: false });
    if (!error) {
      const { data: urlData } = service.storage.from("store-products").getPublicUrl(path);
      photoUrl = urlData.publicUrl;
    }
  }

  await service.from("store_products").insert({
    name,
    description,
    price_cents: Math.round(price_brl * 100),
    original_price_cents: original_price_brl > 0 ? Math.round(original_price_brl * 100) : null,
    photo_url: photoUrl,
    supplier_name,
    category,
    checkout_type,
    external_url,
    featured,
    active: true,
  });

  revalidatePath("/admin/loja");
  revalidatePath("/loja");
}

export async function sincronizarPrintfulAction() {
  await assertAdmin();
  await syncPrintfulCatalog();
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

export async function toggleFeaturedAction(formData: FormData) {
  const service = await assertAdmin();
  const id = formData.get("id") as string;
  const featured = formData.get("featured") === "true";

  await service.from("store_products").update({ featured: !featured }).eq("id", id);

  revalidatePath("/admin/loja");
  revalidatePath("/loja");
}
