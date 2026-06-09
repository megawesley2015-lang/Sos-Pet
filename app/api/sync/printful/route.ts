import { NextRequest } from "next/server";
import { syncPrintfulCatalog } from "@/lib/services/printful";
import { ok, fail } from "@/lib/api-response";

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
  try {
    // Validar autorização
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return fail(Object.assign(new Error("Missing or invalid Authorization header"), { status: 401 }));
    }

    const token = authHeader.slice(7); // "Bearer " = 7 chars
    const syncToken = process.env.SYNC_TOKEN ?? "";

    if (!syncToken || token !== syncToken) {
      return fail(Object.assign(new Error("Invalid token"), { status: 403 }));
    }

    // Disparar sincronização
    console.log("[API] Iniciando sincronização Printful...");
    const result = await syncPrintfulCatalog();

    return ok({ message: "Catálogo sincronizado com sucesso", ...result });
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
