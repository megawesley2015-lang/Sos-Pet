import { z } from 'zod'

export const prestadorUpdateSchema = z.object({
  nome: z.string().min(2).max(100),
  categoria: z.enum([
    'clinica', 'petshop', 'banho_tosa', 'adestrador',
    'veterinario', 'hotel_pet', 'outros',
  ]),
  descricao: z.string().max(1000).optional(),
  telefone: z.string().regex(/^\d{10,11}$/).optional(),
  endereco: z.string().optional(),
  cidade: z.string().min(1).max(100),
  emergencia_24h: z.boolean(),
})

export type PrestadorUpdateInput = z.infer<typeof prestadorUpdateSchema>
