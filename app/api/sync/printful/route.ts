import { NextRequest, NextResponse } from "next/server";
import { syncPrintfulCatalog } from "@/lib/services/printful";
import { ok, fail } from "@/lib/api-response";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

const POST_LIMIT = { limit: 10, windowMs: 60 * 60_000 }; // 10 req/hora — sync é pesado

/**
 * POST /api/sync/printful
 *
 * Sincroniza o catálogo de produtos do Printful para a tabela store_products.
 * Requer autorização: Bearer token no header Authorization.
 *
 * Token pode ser:
 * - SYNC_TOKEN (secret configurada em .env)
 * - JWT do usuário admin (futuro)
 *
 * Retorna status e contagem de produtos criados/atualizados.
 */
export async function POST(req: NextRequest) {
  // Auth check ANTES do rate limit — requisições não-autenticadas não consomem quota
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return fail(Object.assign(new Error("Missing or invalid Authorization header"), { status: 401 }));
  }
  const token = authHeader.slice(7);
  const syncToken = process.env.SYNC_TOKEN ?? "";
  if (!syncToken || token !== syncToken) {
    return fail(Object.assign(new Error("Invalid token"), { status: 403 }));
  }

  const rl = await checkRateLimit(`sync-printful:${getClientIp(req)}`, POST_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Muitas requisições. Tente novamente em alguns instantes.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {

    // Disparar sincronização
    console.log("[API] Iniciando sincronização Printful...");
    const result = await syncPrintfulCatalog();

    const res = ok({ message: "Catálogo sincronizado com sucesso", ...result });
    Object.entries(rateLimitHeaders(rl)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (error) {
    console.error("[API /sync/printful] Erro:", error);
    return fail(error);
  }
}

/**
 * GET /api/sync/printful
 *
 * Health check do endpoint de sincronização.
 */
export async function GET() {
  return ok({ status: "ok" });
}
