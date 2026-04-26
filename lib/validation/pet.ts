import { z } from "zod";

/**
 * Schemas Zod para criar/editar pets.
 *
 * - createPetSchema: campos do formulário SEM o owner_id e SEM photo_url
 *   (esses são preenchidos no server action: owner_id = auth.uid() ou null,
 *    photo_url = URL retornada pelo Storage após upload).
 *
 * - updatePetSchema: tudo opcional (PATCH).
 */

const phoneSchema = z
  .string()
  .min(8, "Telefone muito curto")
  .max(20, "Telefone muito longo")
  .regex(/^[\d\s()+\-]+$/, "Use só números e (), +, -, espaço");

export const createPetSchema = z.object({
  kind: z.enum(["lost", "found"], {
    message: "Selecione perdido ou encontrado",
  }),

  name: z
    .string()
    .max(60, "Nome muito longo")
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),

  species: z.enum(["dog", "cat", "other"], {
    message: "Selecione a espécie",
  }),

  breed: z
    .string()
    .max(60)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),

  color: z.string().min(2, "Informe a cor predominante").max(60),

  size: z
    .enum(["small", "medium", "large"])
    .optional()
    .nullable(),

  sex: z
    .enum(["male", "female", "unknown"])
    .optional()
    .nullable(),

  age_approx: z
    .string()
    .max(40)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),

  description: z
    .string()
    .max(1000, "Descrição muito longa")
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),

  behavior: z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),

  neighborhood: z.string().min(2, "Informe o bairro").max(80),
  city: z.string().min(2, "Informe a cidade").max(80),
  state: z
    .string()
    .max(2)
    .optional()
    .transform((v) => (v?.trim() ? v.trim().toUpperCase() : null)),

  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use o seletor)")
    .refine((d) => {
      const date = new Date(d);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return date <= today;
    }, "Data não pode estar no futuro"),

  contact_name: z.string().min(2, "Informe seu nome").max(80),
  contact_phone: phoneSchema,
  contact_whatsapp: z
    .union([z.literal("on"), z.literal("true"), z.boolean(), z.undefined()])
    .transform((v) => v === "on" || v === "true" || v === true),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;

export const updatePetSchema = createPetSchema.partial();
export type UpdatePetInput = z.infer<typeof updatePetSchema>;

/**
 * Validação separada para o arquivo de foto (vem como File, não FormData entry).
 *
 * Limites MVP:
 *   - tipos: jpg, png, webp
 *   - tamanho: 5 MB
 */
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function validatePhoto(
  file: File | null | undefined
): { ok: true; file: File } | { ok: false; error: string } | { ok: true; file: null } {
  if (!file || file.size === 0) {
    return { ok: true, file: null };
  }
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "Formato inválido. Use JPG, PNG ou WebP.",
    };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return {
      ok: false,
      error: "Foto muito grande. Máximo 5 MB.",
    };
  }
  return { ok: true, file };
}
