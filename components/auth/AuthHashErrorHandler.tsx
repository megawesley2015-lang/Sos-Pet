"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { mensagemAuthError } from "@/lib/auth/friendly-error";

/**
 * Captura erros de auth que o Supabase devolve no HASH fragment (#error=...)
 * quando um link de e-mail expira, é inválido ou já foi usado.
 *
 * Por que isso é necessário:
 * O hash fragment NUNCA é enviado ao servidor, então o route handler em
 * app/auth/callback/route.ts não consegue tratá-lo. Além disso, links
 * expirados são redirecionados pelo Supabase para a Site URL (raiz "/"),
 * não para /auth/callback. Sem este handler, o usuário cai numa página
 * normal com a URL suja e sem nenhuma explicação.
 *
 * Este componente é montado globalmente no root layout. Ao detectar um erro
 * de auth (no hash ou na query), limpa a URL e redireciona para /login com
 * uma mensagem amigável, que o LoginForm exibe via ?auth_error=.
 */
export function AuthHashErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    // O erro pode chegar no hash (#error=...) ou na query (?error=...).
    const hash = window.location.hash.replace(/^#/, "");
    const search = window.location.search.replace(/^\?/, "");

    const params = new URLSearchParams(hash || search);
    const error = params.get("error");
    const errorCode = params.get("error_code");
    const errorDescription = params.get("error_description");

    // Gate: só agir quando há sinais específicos do Supabase Auth, para não
    // colidir com outros usos legítimos de ?error= em outras rotas.
    if (!error || (!errorCode && !errorDescription)) return;

    const message = mensagemAuthError({
      code: errorCode,
      error,
      description: errorDescription,
    });

    router.replace(`/login?auth_error=${encodeURIComponent(message)}`);
  }, [router]);

  return null;
}
