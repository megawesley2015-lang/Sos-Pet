/**
 * Utilitários do Turnstile — sem "use client" nem "use server".
 * Pode ser importado tanto por Server Actions quanto por Client Components.
 */

/** Extrai o token do Turnstile de um FormData enviado pelo formulário. */
export function extractTurnstileToken(formData: FormData): string | null {
  const token = formData.get("cf-turnstile-response");
  return typeof token === "string" ? token : null;
}
