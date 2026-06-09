/**
 * Schemas de validação Zod — Módulo ONG
 * Importados pelas Server Actions e pelos testes unitários.
 */
import { z } from "zod";

export const ShelterSchema = z.object({
  name:         z.string().min(2, "Nome obrigatório").max(150),
  type:         z.enum(["ong", "protetor"]),
  cnpj:         z.string().max(20).optional(),
  phone:        z.string().min(10, "Telefone inválido").max(20),
  email:        z.string().email().optional().or(z.literal("")),
  city:         z.string().min(2, "Cidade obrigatória").max(100),
  neighborhood: z.string().max(100).optional(),
  description:  z.string().max(500).optional(),
});

export const ShelterPetSchema = z.object({
  name:           z.string().max(100).optional(),
  species:        z.enum(["dog", "cat", "other"]),
  breed:          z.string().max(100).optional(),
  color:          z.string().min(1, "Cor é obrigatória").max(80),
  size:           z.enum(["small", "medium", "large"]),
  sex:            z.enum(["male", "female", "unknown"]),
  estimated_age:  z.string().max(50).optional(),
  rescue_date:    z.string().min(1, "Data de resgate é obrigatória"),
  rescue_location: z.string().max(200).optional(),
  health_status:  z.enum(["healthy", "recovering", "critical", "treated"]).default("healthy"),
  behavior:       z.string().max(300).optional(),
  description:    z.string().max(1000).optional(),
  photo_url:      z.string().url().optional().or(z.literal("")),
  weight_kg:      z.coerce.number().positive().max(200).optional(),
  microchip:      z.string().max(50).optional(),
  is_castrated:   z.preprocess((v) => v === "on" || v === "true", z.boolean()).default(false),
});

export const AdoptionSchema = z.object({
  pet_id:               z.string().uuid("Pet inválido"),
  adopter_name:         z.string().min(2, "Nome do adotante obrigatório").max(150),
  adopter_phone:        z.string().min(10, "Telefone inválido").max(20),
  adopter_email:        z.string().email().optional().or(z.literal("")),
  adopter_city:         z.string().min(2, "Cidade obrigatória").max(100),
  adopter_neighborhood: z.string().max(100).optional(),
  adoption_date:        z.string().min(1, "Data de adoção obrigatória"),
  follow_up_30_date:    z.string().optional(),
  follow_up_30_notes:   z.string().max(1000).optional(),
  follow_up_90_date:    z.string().optional(),
  follow_up_90_notes:   z.string().max(1000).optional(),
  status:               z.enum(["active", "returned", "deceased", "transferred"]).default("active"),
});

export const MedicalRecordSchema = z.object({
  record_date:  z.string().min(1),
  type:         z.enum(["consultation", "surgery", "exam", "treatment", "observation"]),
  description:  z.string().min(1, "Descrição obrigatória").max(2000),
  vet_name:     z.string().max(100).optional(),
  weight_kg:    z.coerce.number().min(0).max(200).optional(),
  notes:        z.string().max(1000).optional(),
});

export const VaccinationSchema = z.object({
  vaccine_name:   z.string().min(1, "Nome da vacina obrigatório").max(100),
  applied_date:   z.string().min(1, "Data de aplicação obrigatória"),
  next_dose_date: z.string().optional(),
  vet_name:       z.string().max(100).optional(),
  batch:          z.string().max(60).optional(),
  notes:          z.string().max(500).optional(),
});

export const MedicationSchema = z.object({
  medication_name: z.string().min(1, "Nome do medicamento obrigatório").max(150),
  dosage:          z.string().min(1, "Dosagem obrigatória").max(100),
  frequency:       z.string().min(1, "Frequência obrigatória").max(100),
  start_date:      z.string().min(1, "Data de início obrigatória"),
  end_date:        z.string().optional(),
  is_ongoing:      z.coerce.boolean().default(false),
  reason:          z.string().max(300).optional(),
  notes:           z.string().max(500).optional(),
});

/** Calcula badges de vacina baseado nas datas. Testável sem DB. */
export function calcVaccineBadge(
  next_dose_date: string | null,
  today: string
): "overdue" | "warning" | null {
  if (!next_dose_date) return null;
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const laterStr = thirtyDaysLater.toISOString().split("T")[0];
  if (next_dose_date <= today) return "overdue";
  if (next_dose_date <= laterStr) return "warning";
  return null;
}

/** Verifica se uma adoção tem follow-up de N dias atrasado. */
function isFollowUpOverdue(
  adoption_date: string,
  follow_up_date: string | null,
  days: number,
  today: string
): boolean {
  if (follow_up_date) return false;
  const due = new Date(adoption_date);
  due.setDate(due.getDate() + days);
  return due.toISOString().split("T")[0] <= today;
}

/** Follow-up 30d atrasado: não registrado E adoção tem 30+ dias. */
export function isFollowUp30Overdue(
  adoption_date: string,
  follow_up_30_date: string | null,
  today: string
): boolean {
  return isFollowUpOverdue(adoption_date, follow_up_30_date, 30, today);
}

/** Follow-up 90d atrasado: não registrado E adoção tem 90+ dias. */
export function isFollowUp90Overdue(
  adoption_date: string,
  follow_up_90_date: string | null,
  today: string
): boolean {
  return isFollowUpOverdue(adoption_date, follow_up_90_date, 90, today);
}
