import { z } from "zod";

export const createParceiroSchema = z.object({
  nome: z.string().min(2, "Informe seu nome").max(80),

  email: z
    .string()
    .min(1, "Informe seu e-mail")
    .max(120)
    .transform((v) => v.trim().toLowerCase())
    .refine(
      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "E-mail inválido"
    ),

  empresa: z
    .string()
    .max(120)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),

  mensagem: z
    .string()
    .min(10, "Conte um pouco mais (mín. 10 caracteres)")
    .max(1000, "Mensagem muito longa (máx. 1000)")
    .transform((v) => v.trim()),
});

export type CreateParceiroInput = z.infer<typeof createParceiroSchema>;
