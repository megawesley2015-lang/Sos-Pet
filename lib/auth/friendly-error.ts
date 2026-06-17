/**
 * Mapeia erros de auth do Supabase para mensagens amigáveis em PT-BR.
 *
 * Usado tanto no handler client-side (hash fragment) quanto no callback
 * server-side, garantindo que o usuário sempre veja texto claro — nunca um
 * erro técnico cru como "invalid request: both auth code and code verifier...".
 */
const MENSAGENS: Record<string, string> = {
  otp_expired: "O link expirou. Use “Esqueci minha senha” para receber um novo.",
  access_denied:
    "O link é inválido ou já foi usado. Solicite um novo para continuar.",
};

export function mensagemAuthError(params: {
  code?: string | null;
  error?: string | null;
  description?: string | null;
}): string {
  const { code, error, description } = params;
  return (
    (code ? MENSAGENS[code] : undefined) ??
    (error ? MENSAGENS[error] : undefined) ??
    description ??
    "Não foi possível concluir a autenticação. Tente novamente."
  );
}
