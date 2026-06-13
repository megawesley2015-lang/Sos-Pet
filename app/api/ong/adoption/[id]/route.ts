import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { ok, fail } from "@/lib/api-response";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

const GET_LIMIT = { limit: 60, windowMs: 60_000 }; // 60 req/min por IP

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = await checkRateLimit(`ong-adoption:${getClientIp(req)}`, GET_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Muitas requisições. Tente novamente em alguns instantes.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) return fail(new Error("Não autenticado"));

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shelter) return fail(new Error("Sem shelter"));

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

  if (!adoption) return fail(new Error("Não encontrado"));

  const res = ok({ adoption });
  Object.entries(rateLimitHeaders(rl)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}
