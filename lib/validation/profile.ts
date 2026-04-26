import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Nome muito curto")
    .max(80, "Nome muito longo"),

  phone: z
    .string()
    .max(20, "Telefone muito longo")
    .regex(/^[\d\s()+\-]*$/, "Use só números e (), +, -, espaço")
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
