import { createServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { redirect } from "next/navigation";
import LojaAdminClient from "./LojaAdminClient";

export const metadata = { title: "Loja — Admin · SOS Pet" };

export default async function AdminLojaPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  const service = createServiceClient();

  const { data: products } = await service
    .from("store_products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return <LojaAdminClient products={products ?? []} />;
}
