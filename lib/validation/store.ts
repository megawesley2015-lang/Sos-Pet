import { z } from "zod";

export const storeProductSchema = z
  .object({
    name: z.string().trim().min(2, "Nome do produto obrigatório").max(140),
    description: z.string().trim().max(300).optional().nullable(),
    price_brl: z
      .string()
      .trim()
      .min(1, "Preço obrigatório")
      .regex(/^\d+(\.\d{1,2})?$/, "Preço inválido")
      .transform((value) => Number(value)),
    original_price_brl: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((value) => {
        if (!value) return 0;
        return Number(value);
      }),
    supplier_name: z.string().trim().optional().nullable(),
    category: z.enum([
      "plaquinha",
      "coleira",
      "acessorio",
      "roupa",
      "higiene",
      "alimentacao",
      "geral",
    ]),
    checkout_type: z.enum(["external", "internal"]).default("external"),
    external_url: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (value) => {
          if (!value) return true;
          try {
            const url = new URL(value);
            return url.protocol === "https:";
          } catch {
            return false;
          }
        },
        { message: "A URL externa precisa ser HTTPS válida." }
      ),
    featured: z
      .union([z.string(), z.boolean()])
      .transform((value) => {
        if (typeof value === "boolean") return value;
        return value === "true";
      }),
  })
  .superRefine((data, ctx) => {
    if (data.checkout_type === "external" && !data.external_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["external_url"],
        message: "URL externa obrigatória quando o checkout é externo.",
      });
    }
  });

export type StoreProductInput = z.infer<typeof storeProductSchema>;

export const plaquinhaCheckoutSchema = z.object({
  pet_name: z.string().trim().max(80).optional().nullable(),
  species: z.enum(["dog", "cat", "other"]).default("dog"),
  tag_phone: z.string().trim().min(8, "Telefone obrigatório").max(20),
  owner_name: z.string().trim().min(2, "Nome do tutor obrigatório"),
  owner_email: z.string().trim().email("E-mail inválido"),
  cep: z.string().trim().min(8, "CEP obrigatório"),
  logradouro: z.string().trim().min(1, "Logradouro obrigatório"),
  numero: z.string().trim().min(1, "Número obrigatório"),
  complemento: z.string().trim().optional().nullable(),
  bairro: z.string().trim().min(1, "Bairro obrigatório"),
  cidade: z.string().trim().min(1, "Cidade obrigatória"),
  estado: z.string().trim().min(2, "Estado obrigatório"),
});

export type PlaquinhaCheckoutInput = z.infer<typeof plaquinhaCheckoutSchema>;
