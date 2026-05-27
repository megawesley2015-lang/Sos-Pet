import { z } from 'zod'

export const PetSchema = z.object({
  tipo: z.enum(['perdido', 'encontrado'], { message: 'Selecione perdido ou encontrado' }),
  nome: z
    .string()
    .max(100)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  especie: z.enum(['cao', 'gato', 'outro'], { message: 'Selecione a espécie' }),
  raca: z
    .string()
    .max(100)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  cor: z.string().min(2, 'Informe a cor predominante').max(50),
  porte: z.enum(['pequeno', 'medio', 'grande']).optional().nullable(),
  sexo: z.enum(['macho', 'femea', 'desconhecido']).optional().nullable(),
  idade_aprox: z
    .string()
    .max(50)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  descricao: z
    .string()
    .max(1000, 'Descrição muito longa')
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  comportamento: z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  bairro: z
    .string()
    .max(100)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  cidade: z.string().min(2, 'Informe a cidade').max(100),
  data_ocorrencia: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine((d) => {
      const date = new Date(d)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      return date <= today
    }, 'Data não pode estar no futuro'),
  foto_url: z.string().url().optional().nullable(),
  contato: z
    .string()
    .min(8, 'Telefone muito curto')
    .max(20, 'Telefone muito longo')
    .regex(/^[\d\s()+\-]+$/, 'Use só números e (), +, -, espaço'),
})

export const PetFiltrosSchema = z.object({
  tipo: z.string().optional(),
  especie: z.string().optional(),
  cidade: z.string().optional(),
  bairro: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const PetUpdateSchema = PetSchema.partial()

export type PetInput = z.infer<typeof PetSchema>
export type PetFiltros = z.infer<typeof PetFiltrosSchema>
export type PetUpdateInput = z.infer<typeof PetUpdateSchema>
