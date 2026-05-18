import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Endpoint de callback do Supabase Auth (PKCE).
 *
 * Recebe o `code` da URL após:
 *   - signup confirmation (signUp + emailRedirectTo)
 *   - magic link
 *   - password recovery (resetPasswordForEmail + redirectTo)
 *   - OAuth (futuro)
 *
 * Troca o code por uma sessão e seta cookies via @supabase/ssr,
 * depois redireciona pro `next` (default /pets).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  const next = url.searchParams.get("next") ?? "/pets";

  // Caso 1: Supabase devolveu erro explícito (link expirado, já usado, etc.)
  if (error) {
    const dest = new URL("/login", url.origin);
    dest.searchParams.set("auth_error", errorDescription ?? error);
    return NextResponse.redirect(dest);
  }

  // Caso 2: sem code (ex: usuário caiu aqui sem fluxo) → manda pro login
  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const type = url.searchParams.get("type");

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  );

  if (exchangeError) {
    const dest = new URL("/login", url.origin);
    dest.searchParams.set("auth_error", exchangeError.message);
    return NextResponse.redirect(dest);
  }

  // Detecta fluxo de recuperação de senha:
  // 1. via param ?type=recovery ou ?next=/redefinir-senha (quando NEXT_PUBLIC_SITE_URL correto)
  // 2. fallback: recovery_sent_at recente (<15min) — cobre caso de allowlist faltando no Supabase
  let isRecovery = type === "recovery" || next === "/redefinir-senha";
  if (!isRecovery) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.recovery_sent_at) {
      const ageMs = Date.now() - new Date(user.recovery_sent_at).getTime();
      if (ageMs < 15 * 60 * 1000) isRecovery = true; // janela de 15 minutos
    }
  }

  if (isRecovery) {
    return NextResponse.redirect(new URL("/redefinir-senha", url.origin));
  }

  // Sucesso → manda pro destino, garantindo que o path é interno
  const safeNext = next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/pets";
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
