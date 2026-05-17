import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shelter) return NextResponse.json({ error: "Sem shelter" }, { status: 403 });

  const { data: adoption } = await supabase
    .from("adoptions")
    .select(`
      id, adopter_name, adopter_phone, adopter_email,
      adopter_city, adopter_neighborhood, adoption_date,
      follow_up_30_date, follow_up_30_notes,
      follow_up_90_date, follow_up_90_notes,
      status, created_at,
      shelter_pets(name, species)
    `)
    .eq("id", id)
    .eq("shelter_id", shelter.id)
    .maybeSingle();

  if (!adoption) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  return NextResponse.json({ adoption });
}
