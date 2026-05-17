import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";

/**
 * GET /api/ong/available-pets
 * Retorna pets com status 'available' do shelter do usuário autenticado.
 * Usado no formulário de nova adoção.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shelter) {
    return NextResponse.json({ pets: [] });
  }

  const { data: pets } = await supabase
    .from("shelter_pets")
    .select("id, name, species")
    .eq("shelter_id", shelter.id)
    .eq("status", "available")
    .order("name", { ascending: true, nullsFirst: false });

  return NextResponse.json({ pets: pets ?? [] });
}
