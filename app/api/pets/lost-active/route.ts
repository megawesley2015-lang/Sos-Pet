import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api-response";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

const GET_LIMIT = { limit: 30, windowMs: 60_000 }; // 30 req/min por IP

/**
 * GET /api/pets/lost-active
 *
 * Retorna pets com kind=lost e status=active.
 * Usado pelo formulário de avistamento anônimo (sem autenticação).
 */
export async function GET(request: NextRequest) {
  // Rate limit com degradação graciosa: se Redis não estiver configurado, permite a requisição.
  let rl: Awaited<ReturnType<typeof checkRateLimit>> = { allowed: true, remaining: 99, resetAt: Date.now() + 60_000 };
  try {
    rl = await checkRateLimit(`lost-active:${getClientIp(request)}`, GET_LIMIT);
  } catch {
    // Upstash não configurado — fallback permissivo
  }
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Muitas requisições. Tente novamente em alguns instantes.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rl) }
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

  if (error) return fail(error);

  const res = ok({ pets: pets ?? [] });
  Object.entries(rateLimitHeaders(rl)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}
