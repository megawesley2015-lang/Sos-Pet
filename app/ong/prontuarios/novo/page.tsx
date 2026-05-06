"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { NovoProntuarioForm } from "./NovoProntuarioForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Novo Prontuário — ONG SOS Pet" };

export default async function NovoProntuarioPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  // Pets cadastrados pela ONG (owner_id = ong user id)
  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, species, status")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-fg">Novo Prontuário</h1>
        <p className="text-sm text-fg-muted">
          Crie o prontuário médico para um pet resgatado.
        </p>
      </div>
      <NovoProntuarioForm
        ongId={user.id}
        pets={(pets ?? []).map((p) => ({
          id: p.id,
          name: p.name ?? "Sem nome",
          species: p.species,
        }))}
      />
    </div>
  );
}
