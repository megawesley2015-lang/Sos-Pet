import { z } from "zod";

export const createReviewSchema = z.object({
  prestador_id: z.string().uuid("ID do prestador inválido"),

  nota: z.coerce
    .number()
    .int("Nota deve ser um número inteiro")
    .min(1, "Nota mínima: 1")
    .max(5, "Nota máxima: 5"),

  comentario: z
    .string()
    .max(500, "Comentário muito longo (máx. 500 caracteres)")
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
