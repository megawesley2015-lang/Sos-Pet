import { z } from 'zod'

const todayIso = () => new Date().toISOString().split('T')[0]

export const vaccinationSchema = z.object({
  vaccine_name: z.string().min(2).max(200),
  applied_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => v <= todayIso(), { message: 'Data de aplicação não pode ser futura' }),
  next_due_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  veterinarian: z.string().max(100).optional(),
  clinic: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => !data.next_due_at || data.next_due_at > data.applied_at,
  { message: 'Próxima dose deve ser após a data de aplicação', path: ['next_due_at'] }
)

export const medicationSchema = z.object({
  medication_name: z.string().min(2).max(200),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['active', 'completed']).default('active'),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => !data.end_date || data.end_date >= data.start_date,
  { message: 'Data de fim deve ser igual ou após a data de início', path: ['end_date'] }
)

export const healthRecordSchema = z.object({
  visit_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => v <= todayIso(), { message: 'Data da consulta não pode ser futura' }),
  reason: z.string().min(3).max(500),
  diagnosis: z.string().max(1000).optional(),
  treatment: z.string().max(1000).optional(),
  veterinarian: z.string().max(100).optional(),
  clinic: z.string().max(200).optional(),
  weight_kg: z.number().min(0.1).max(200).optional(),
  notes: z.string().max(1000).optional(),
})

export type VaccinationInput = z.infer<typeof vaccinationSchema>
export type MedicationInput = z.infer<typeof medicationSchema>
export type HealthRecordInput = z.infer<typeof healthRecordSchema>
