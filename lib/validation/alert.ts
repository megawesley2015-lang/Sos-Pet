import { z } from "zod";

export const createAlertSchema = z.object({
  pet_id: z.string().uuid("ID do pet inválido"),

  raio_km: z.coerce
    .number()
    .int("Raio deve ser um número inteiro")
    .min(1, "Raio mínimo: 1 km")
    .max(50, "Raio máximo: 50 km")
    .default(5),

  mensagem: z
    .string()
    .max(280, "Mensagem muito longa (máx. 280 caracteres)")
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
