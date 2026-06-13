import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { ok, fail } from "@/lib/api-response";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

const GET_LIMIT = { limit: 60, windowMs: 60_000 }; // 60 req/min por IP

/**
 * GET /api/ong/available-pets
 * Retorna pets com status 'available' do shelter do usuário autenticado.
 * Usado no formulário de nova adoção.
 */
export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(`ong-available-pets:${getClientIp(request)}`, GET_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Muitas requisições. Tente novamente em alguns instantes.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    return fail(new Error("Não autenticado"));
  }

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shelter) {
    return ok({ pets: [] });
  }

  const { data: pets } = await supabase
    .from("shelter_pets")
    .select("id, name, species")
    .eq("shelter_id", shelter.id)
    .eq("status", "available")
    .order("name", { ascending: true, nullsFirst: false });

  const res = ok({ pets: pets ?? [] });
  Object.entries(rateLimitHeaders(rl)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}
