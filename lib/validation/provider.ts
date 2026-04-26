import { z } from "zod";

const phoneOpt = z
  .string()
  .max(20, "Telefone muito longo")
  .regex(/^[\d\s()+\-]*$/, "Use só números e (), +, -, espaço")
  .optional()
  .transform((v) => (v?.trim() ? v.trim() : null));

export const PRESTADOR_CATEGORIES = [
  { value: "veterinario", label: "Veterinário" },
  { value: "petshop", label: "Pet Shop" },
  { value: "adestrador", label: "Adestrador" },
  { value: "hospedagem", label: "Hospedagem" },
  { value: "banho_tosa", label: "Banho & Tosa" },
  { value: "outro", label: "Outro" },
] as const;

export const createProviderSchema = z.object({
  nome: z.string().min(2, "Informe o nome").max(120),

  categoria: z.enum(
    [
      "veterinario",
      "petshop",
      "adestrador",
      "hospedagem",
      "banho_tosa",
      "outro",
    ],
    { message: "Selecione uma categoria" }
  ),

  descricao: z
    .string()
    .max(800, "Descrição muito longa (máx. 800)")
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),

  telefone: phoneOpt,
  whatsapp: phoneOpt,

  email: z
    .string()
    .max(120)
    .optional()
    .transform((v) => (v?.trim() ? v.trim().toLowerCase() : null))
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "E-mail inválido"
    ),

  instagram: z
    .string()
    .max(60)
    .optional()
    .transform((v) =>
      v?.trim() ? v.trim().replace(/^@/, "").toLowerCase() : null
    ),

  site: z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null))
    .refine(
      (v) => !v || /^https?:\/\//.test(v),
      "URL precisa começar com http:// ou https://"
    ),

  cidade: z.string().min(2, "Informe a cidade").max(80),
  bairro: z
    .string()
    .max(80)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  estado: z
    .string()
    .max(2)
    .optional()
    .transform((v) => (v?.trim() ? v.trim().toUpperCase() : null)),
  endereco: z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),

  emergencia24h: z
    .union([z.literal("on"), z.literal("true"), z.boolean(), z.undefined()])
    .transform((v) => v === "on" || v === "true" || v === true),
  delivery: z
    .union([z.literal("on"), z.literal("true"), z.boolean(), z.undefined()])
    .transform((v) => v === "on" || v === "true" || v === true),
  agendamento_online: z
    .union([z.literal("on"), z.literal("true"), z.boolean(), z.undefined()])
    .transform((v) => v === "on" || v === "true" || v === true),
});

export type CreateProviderInput = z.infer<typeof createProviderSchema>;

/**
 * Slugify — gera slug URL-safe a partir do nome do prestador.
 *   "Vet Caramelo & Cia."  →  "vet-caramelo-cia"
 *   "Pet Shop São José"    →  "pet-shop-sao-jose"
 *
 * Remove diacríticos via NFD + range Unicode ̀-ͯ (combining marks).
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (combining diacritical marks)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}
