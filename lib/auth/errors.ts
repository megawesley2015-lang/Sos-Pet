/**
 * Tratamento centralizado de erros de auth do Supabase.
 *
 * Caso clássico (já vivido no v2): refresh token corrompido (browser dorme,
 * sessão expira, token rotacionado em outro tab) deixa a sessão "zumbi".
 * Sem auto-cleanup, todas as chamadas autenticadas falham silenciosamente.
 *
 * Esta função detecta os sintomas e força um signOut local pra resetar o estado.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

const TOKEN_ERROR_PATTERNS = [
  "invalid refresh token",
  "refresh_token_not_found",
  "invalid_grant",
  "jwt expired",
  "session_not_found",
];

export interface AuthErrorLike {
  message?: string;
  status?: number;
  code?: string;
  name?: string;
}

export function isAuthTokenError(error: AuthErrorLike | null | undefined): boolean {
  if (!error) return false;
  if (error.status === 401) return true;
  if (error.code === "refresh_token_not_found") return true;

  const msg = (error.message ?? "").toLowerCase();
  return TOKEN_ERROR_PATTERNS.some((p) => msg.includes(p));
}

/**
 * Limpa sessão local quando token tá corrompido.
 * Não joga erro — é "best effort". Loga só em dev.
 */
export async function handleAuthError(
  supabase: AnySupabaseClient,
  error: AuthErrorLike | null | undefined
): Promise<boolean> {
  if (!isAuthTokenError(error)) return false;

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // ignore — supabase pode rejeitar se a sessão já tiver sido invalidada
  }

  if (typeof window !== "undefined") {
    try {
      // Limpa cache de tokens persistidos no browser
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith("sb-") || k.includes("supabase"))
        .forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // localStorage pode estar bloqueado (Safari private mode)
    }
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn("[auth] sessão zumbi detectada e limpa:", error?.message);
  }

  return true;
}
