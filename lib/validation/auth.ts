import { z } from "zod";

/**
 * Schemas Zod usados nos forms e Server Actions de auth.
 *
 * Erros em pt-BR — vão direto pra UI.
 * Validação dupla: client (UX) + server (segurança real).
 */

const emailSchema = z
  .string()
  .min(1, "Informe seu e-mail")
  .email("E-mail inválido");

const passwordSchema = z
  .string()
  .min(8, "Senha precisa de pelo menos 8 caracteres")
  .max(72, "Senha muito longa (máx. 72)"); // bcrypt limit

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Nome muito curto")
      .max(80, "Nome muito longo"),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem",
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem",
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Helper genérico para Server Actions: parse com Zod e retorna
 * { ok: true, data } ou { ok: false, errors: { campo: mensagem } }
 */
export function parseFormData<T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData
): { ok: true; data: z.infer<T> } | { ok: false; errors: Record<string, string> } {
  const raw = Object.fromEntries(formData.entries());
  const result = schema.safeParse(raw);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
