/**
 * Validação de Turnstile (Cloudflare captcha) no servidor.
 *
 * Documentação: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Variáveis de environment necessárias:
 * - NEXT_PUBLIC_TURNSTILE_SITE_KEY (client-side)
 * - TURNSTILE_SECRET_KEY (server-only, secret)
 */

interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
  "error-codes"?: string[];
}

export async function validateTurnstileToken(
  token: string | null
): Promise<{ valid: boolean; error: string | null }> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return {
      valid: false,
      error: "Token Turnstile ausente",
    };
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY não configurada");
    return {
      valid: false,
      error: "Erro na configuração do servidor",
    };
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: TurnstileResponse = await response.json();

    if (!data.success) {
      const errorCodes = data["error-codes"] || data.error_codes || [];
      const errorMsg = errorCodes.join(", ") || "Validação falhou";
      return {
        valid: false,
        error: `Captcha inválido: ${errorMsg}`,
      };
    }

    return { valid: true, error: null };
  } catch (error) {
    console.error("[Turnstile] Erro ao validar:", error);
    return {
      valid: false,
      error: "Erro ao validar captcha — tente novamente",
    };
  }
}
