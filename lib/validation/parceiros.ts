import { z } from 'zod'

const CIDADES_BAIXADA = [
  'Santos', 'Guarujá', 'São Vicente', 'Cubatão', 'Bertioga',
  'Praia Grande', 'Mongaguá', 'Itanhaém', 'Peruíbe',
] as const

export const partnershipRequestSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email(),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  tipo_negocio: z.enum([
    'clinica', 'petshop', 'banho_tosa', 'adestramento',
    'hotel_pet', 'ong', 'outro',
  ]),
  cidade: z.enum(CIDADES_BAIXADA),
  mensagem: z.string().max(1000).optional(),
  aceita_termos: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar os termos' }),
  }),
  turnstile_token: z.string().min(1),
})

export type PartnershipRequestInput = z.infer<typeof partnershipRequestSchema>
