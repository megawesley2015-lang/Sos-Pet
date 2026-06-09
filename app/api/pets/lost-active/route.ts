import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const GET_LIMIT = { limit: 30, windowMs: 60_000 }; // 30 req/min por IP

/**
 * GET /api/pets/lost-active
 *
 * Retorna pets com kind=lost e status=active.
 * Usado pelo formulário de avistamento anônimo (sem autenticação).
 */
export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(`lost-active:${getClientIp(request)}`, GET_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Muitas requisições. Tente novamente em alguns instantes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const supabase = createServiceClient();

  const { data: pets, error } = await supabase
    .from("pets")
    .select("id, name, species, city, neighborhood, photo_url")
    .eq("kind", "lost")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return fail(error);
  }

  return ok({ pets: pets ?? [] });
}
