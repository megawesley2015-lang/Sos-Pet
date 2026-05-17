import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/pets/lost-active
 *
 * Retorna pets com kind=lost e status=active.
 * Usado pelo formulário de avistamento anônimo (sem autenticação).
 */
export async function GET() {
  const supabase = createServiceClient();

  const { data: pets, error } = await supabase
    .from("pets")
    .select("id, name, species, city, neighborhood, photo_url")
    .eq("kind", "lost")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pets: pets ?? [] });
}
