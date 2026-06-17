import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Supabase às vezes envia o `code` para a raiz do site (?code=...)
  // em vez de /auth/callback quando o redirectTo não bate exatamente
  // com o allowlist. Redireciona para o callback preservando todos os params.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && searchParams.has("code")) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  return updateSession(request);
}

/**
 * Matcher: roda em tudo EXCETO assets estáticos e a rota de auth/callback
 * (que precisa setar cookies via Route Handler dela mesma).
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
