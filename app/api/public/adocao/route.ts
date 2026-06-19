import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api-response";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

/**
 * GET /api/public/adocao
 * Catálogo público de pets disponíveis para adoção.
 * Não exige autenticação. Retorna dados não-sensíveis de shelter_pets
 * com status='available', agrupados com o nome do shelter.
 */
const GET_LIMIT = { limit: 120, windowMs: 60_000 };

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(`public-adocao:${getClientIp(request)}`, GET_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Muitas requisições.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const { searchParams } = new URL(request.url);
  const species = searchParams.get("species"); // dog | cat | other
  const city    = searchParams.get("city");

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("shelter_pets")
    .select(`
      id, name, species, breed, color, size, sex,
      estimated_age, health_status, behavior, description,
      photo_url, is_castrated, rescue_date, shelter_id,
      shelters ( id, name, city, neighborhood, logo_url, phone, email )
    `)
    .eq("status", "available")
    .order("rescue_date", { ascending: false })
    .limit(60);

  if (species) query = query.eq("species", species);
  if (city)    query = query.ilike("shelters.city", `%${city}%`);

  const { data, error } = await query;

  if (error) return fail(error);

  const res = ok({ pets: data ?? [] });
  Object.entries(rateLimitHeaders(rl)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}
