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

export const createSightingSchema = z.object({
  pet_id: z.string().uuid("ID do pet inválido"),
  lat: z.coerce
    .number()
    .min(-90, "Latitude inválida")
    .max(90, "Latitude inválida"),
  lng: z.coerce
    .number()
    .min(-180, "Longitude inválida")
    .max(180, "Longitude inválida"),
  address: z
    .string()
    .trim()
    .max(240, "Endereço muito longo")
    .optional()
    .nullable()
    .transform((value) => (value?.trim() ? value.trim() : null)),
  description: z
    .string()
    .trim()
    .max(1000, "Descrição muito longa")
    .optional()
    .nullable()
    .transform((value) => (value?.trim() ? value.trim() : null)),
});

export type CreateSightingInput = z.infer<typeof createSightingSchema>;
