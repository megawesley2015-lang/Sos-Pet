// lib/schemas/pet.ts — schema Zod alinhado com colunas reais da tabela pets

import { z } from 'zod'

export const PetKindEnum = z.enum(['lost', 'found'], {
  errorMap: () => ({ message: 'Selecione o tipo de registro' }),
})

export const PetSpeciesEnum = z.enum(['dog', 'cat', 'other'], {
  errorMap: () => ({ message: 'Selecione a espécie' }),
})

export const PetSizeEnum = z.enum(['small', 'medium', 'large'], {
  errorMap: () => ({ message: 'Selecione o porte' }),
})

export const PetSexEnum = z.enum(['male', 'female', 'unknown'], {
  errorMap: () => ({ message: 'Selecione o sexo' }),
})

// Base separado do .refine() — ZodObject permite .partial(), ZodEffects não
const petSchemaBase = z.object({

  kind:    PetKindEnum,
  species: PetSpeciesEnum,

  name: z
    .string()
    .max(60, 'Máximo 60 caracteres')
    .optional()
    .or(z.literal('')),

  breed: z
    .string()
    .max(60, 'Máximo 60 caracteres')
    .optional()
    .or(z.literal('')),

  color: z
    .string()
    .min(2, 'Informe a cor predominante')
    .max(60, 'Máximo 60 caracteres'),

  size: PetSizeEnum,
  sex:  PetSexEnum,

  age_approx: z
    .string()
    .max(30, 'Máximo 30 caracteres')
    .optional()
    .or(z.literal('')),

  description: z
    .string()
    .min(10, 'Descreva o pet com pelo menos 10 caracteres')
    .max(500, 'Máximo 500 caracteres'),

  behavior: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal('')),

  photo_url: z
    .string()
    .url('URL da foto inválida')
    .optional()
    .or(z.literal('')),

  neighborhood: z
    .string()
    .min(2, 'Informe o bairro')
    .max(80, 'Máximo 80 caracteres'),

  city: z
    .string()
    .min(2, 'Informe a cidade')
    .max(80, 'Máximo 80 caracteres'),

  state: z
    .string()
    .length(2, 'Use a sigla do estado (ex: SP)')
    .toUpperCase()
    .optional()
    .or(z.literal('')),

  event_date: z
    .string()
    .refine(
      (val) => !val || new Date(val) <= new Date(),
      { message: 'A data não pode ser no futuro' }
    )
    .optional()
    .or(z.literal('')),

  contact_name: z
    .string()
    .min(2, 'Informe seu nome')
    .max(80, 'Máximo 80 caracteres'),

  contact_phone: z
    .string()
    .regex(
      /^(\+55\s?)?(\(?\d{2}\)?\s?)(\d{4,5}[-\s]?\d{4})$/,
      'Telefone inválido — use (11) 99999-9999'
    )
    .optional()
    .or(z.literal('')),

  contact_whatsapp: z.boolean().default(false),

  // Coordenadas GPS — opcionais, capturadas pelo browser
  // z.preprocess trata string vazia (FormData) e undefined (JSON sem o campo)
  latitude: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().min(-90).max(90)
  ).optional(),

  longitude: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().min(-180).max(180)
  ).optional(),
})

// petSchema — com validação cruzada de contato
export const petSchema = petSchemaBase.refine(
  (data) => Boolean(data.contact_phone?.length),
  {
    message: 'Informe um telefone para contato',
    path: ['contact_phone'],
  }
)

export type PetFormData = z.infer<typeof petSchema>

// petUpdateSchema — usa o base (ZodObject) para poder chamar .partial()
// petSchema é ZodEffects (após .refine()) e não tem .partial()
export const petUpdateSchema = petSchemaBase.partial().extend({
  kind: PetKindEnum,
})

export type PetUpdateFormData = z.infer<typeof petUpdateSchema>
