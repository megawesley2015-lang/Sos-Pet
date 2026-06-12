import { z } from 'zod'

export const sightingSchema = z.object({
  pet_id: z.string().uuid('ID de pet inválido'),
  sighted_at: z
    .string()
    .datetime({ message: 'Data inválida' })
    .refine((v) => new Date(v) <= new Date(), { message: 'Data não pode ser futura' }),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  city: z.string().min(1).max(100).optional(),
  neighborhood: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  photo_url: z.string().url().optional(),
}).superRefine((data, ctx) => {
  if (!data.latitude && !data.city) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe a cidade ou ative a geolocalização',
      path: ['city'],
    })
  }
})

export type SightingInput = z.infer<typeof sightingSchema>

export type SightingRow = {
  id: string
  pet_id: string
  reporter_id: string | null
  sighted_at: string | null
  latitude: number | null
  longitude: number | null
  lat: number | null
  lng: number | null
  city: string | null
  neighborhood: string | null
  address: string | null
  description: string | null
  photo_url: string | null
  status: string | null
  report_count: number | null
  created_at: string
}

export type SightingPublic = Omit<SightingRow, 'reporter_id'>
