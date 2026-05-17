import { NextRequest, NextResponse } from "next/server";
import { syncPrintfulCatalog } from "@/lib/services/printful";

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
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // "Bearer " = 7 chars
    const syncToken = process.env.SYNC_TOKEN ?? "";

    if (!syncToken || token !== syncToken) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 403 }
      );
    }

    // Disparar sincronização
    console.log("[API] Iniciando sincronização Printful...");
    const result = await syncPrintfulCatalog();

    return NextResponse.json({
      ok: true,
      message: "Catálogo sincronizado com sucesso",
      ...result,
    });
  } catch (error) {
    console.error("[API /sync/printful] Erro:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/printful
 *
 * Retorna info sobre o último sync (future enhancement)
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/sync/printful",
    method: "POST",
    description: "Sincroniza catálogo do Printful",
    headers: {
      Authorization: "Bearer {SYNC_TOKEN}",
    },
    example: "curl -X POST https://yourdomain.com/api/sync/printful -H 'Authorization: Bearer your-token'",
  });
}
