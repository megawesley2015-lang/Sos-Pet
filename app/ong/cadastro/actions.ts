"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { z } from "zod";

const ShelterSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(150),
  type: z.enum(["ong", "protetor"]),
  cnpj: z.string().max(20).optional(),
  phone: z.string().min(10, "Telefone inválido").max(20),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().min(2, "Cidade obrigatória").max(100),
  neighborhood: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

export type ShelterState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function upsertShelter(
  _prev: ShelterState,
  formData: FormData
): Promise<ShelterState> {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) return { error: "Não autenticado." };

  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => v !== ""));
  const parsed = ShelterSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { data: existing } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("shelters")
      .update(parsed.data)
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("shelters")
      .insert({ ...parsed.data, user_id: user.id });
    if (error) return { error: error.message };
  }

  revalidatePath("/ong/cadastro");
  revalidatePath("/ong/dashboard");
  redirect("/ong/dashboard");
}
