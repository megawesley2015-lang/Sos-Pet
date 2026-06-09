/**
 * Testes — lib/validation/ong.ts
 *
 * Módulo: ONG / Abrigos
 * Cobre: ShelterSchema, ShelterPetSchema, AdoptionSchema,
 *        MedicalRecordSchema, VaccinationSchema, MedicationSchema,
 *        calcVaccineBadge, isFollowUp30Overdue
 */

import { describe, it, expect } from "vitest";
import {
  ShelterSchema,
  ShelterPetSchema,
  AdoptionSchema,
  MedicalRecordSchema,
  VaccinationSchema,
  MedicationSchema,
  calcVaccineBadge,
  isFollowUp30Overdue,
  isFollowUp90Overdue,
} from "@/lib/validation/ong";

// ── Helpers ───────────────────────────────────────────────────

const TODAY = "2026-06-08";

function shelterValido(o: Record<string, unknown> = {}) {
  return { name: "ONG Patinhas", type: "ong", phone: "13999990001", city: "Santos", ...o };
}

function petValido(o: Record<string, unknown> = {}) {
  return {
    species: "dog", color: "Caramelo", size: "medium",
    sex: "male", rescue_date: "2026-06-01", ...o,
  };
}

function adocaoValida(o: Record<string, unknown> = {}) {
  return {
    pet_id: "00000000-0000-0000-0000-000000000001",
    adopter_name: "João Silva",
    adopter_phone: "13999990002",
    adopter_city: "Santos",
    adoption_date: "2026-06-01",
    ...o,
  };
}

// ── ShelterSchema ────────────────────────────────────────────

describe("ShelterSchema", () => {
  it("aceita dados mínimos válidos (ong)", () => {
    expect(ShelterSchema.safeParse(shelterValido()).success).toBe(true);
  });

  it("aceita tipo protetor", () => {
    expect(ShelterSchema.safeParse(shelterValido({ type: "protetor" })).success).toBe(true);
  });

  it("rejeita nome muito curto", () => {
    expect(ShelterSchema.safeParse(shelterValido({ name: "X" })).success).toBe(false);
  });

  it("rejeita tipo inválido", () => {
    expect(ShelterSchema.safeParse(shelterValido({ type: "empresa" })).success).toBe(false);
  });

  it("rejeita telefone curto demais", () => {
    expect(ShelterSchema.safeParse(shelterValido({ phone: "1234" })).success).toBe(false);
  });

  it("rejeita cidade vazia", () => {
    expect(ShelterSchema.safeParse(shelterValido({ city: "X" })).success).toBe(false);
  });

  it("rejeita email inválido", () => {
    expect(ShelterSchema.safeParse(shelterValido({ email: "nao-eh-email" })).success).toBe(false);
  });

  it("aceita email vazio (campo opcional)", () => {
    expect(ShelterSchema.safeParse(shelterValido({ email: "" })).success).toBe(true);
  });

  it("aceita sem campos opcionais", () => {
    const { name, type, phone, city } = shelterValido();
    expect(ShelterSchema.safeParse({ name, type, phone, city }).success).toBe(true);
  });
});

// ── ShelterPetSchema ─────────────────────────────────────────

describe("ShelterPetSchema", () => {
  it("aceita dados mínimos válidos", () => {
    expect(ShelterPetSchema.safeParse(petValido()).success).toBe(true);
  });

  it("rejeita espécie inválida", () => {
    expect(ShelterPetSchema.safeParse(petValido({ species: "fish" })).success).toBe(false);
  });

  it("rejeita cor vazia", () => {
    expect(ShelterPetSchema.safeParse(petValido({ color: "" })).success).toBe(false);
  });

  it("rejeita tamanho inválido", () => {
    expect(ShelterPetSchema.safeParse(petValido({ size: "giant" })).success).toBe(false);
  });

  it("rejeita sexo inválido", () => {
    expect(ShelterPetSchema.safeParse(petValido({ sex: "other" })).success).toBe(false);
  });

  it("rejeita data de resgate vazia", () => {
    expect(ShelterPetSchema.safeParse(petValido({ rescue_date: "" })).success).toBe(false);
  });

  it("aceita health_status crítico", () => {
    expect(ShelterPetSchema.safeParse(petValido({ health_status: "critical" })).success).toBe(true);
  });

  it("rejeita health_status inválido", () => {
    expect(ShelterPetSchema.safeParse(petValido({ health_status: "bad" })).success).toBe(false);
  });

  it("transforma is_castrated 'on' em true", () => {
    const r = ShelterPetSchema.safeParse(petValido({ is_castrated: "on" }));
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.is_castrated).toBe(true);
  });

  it("aceita weight_kg numérico coercido de string", () => {
    const r = ShelterPetSchema.safeParse(petValido({ weight_kg: "12.5" }));
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.weight_kg).toBe(12.5);
  });

  it("rejeita peso negativo", () => {
    expect(ShelterPetSchema.safeParse(petValido({ weight_kg: -1 })).success).toBe(false);
  });

  it("aceita name opcional ausente", () => {
    expect(ShelterPetSchema.safeParse(petValido()).success).toBe(true);
  });

  it("aceita photo_url vazia (campo opcional)", () => {
    expect(ShelterPetSchema.safeParse(petValido({ photo_url: "" })).success).toBe(true);
  });

  it("rejeita photo_url inválida (não URL)", () => {
    expect(ShelterPetSchema.safeParse(petValido({ photo_url: "nao-url" })).success).toBe(false);
  });
});

// ── AdoptionSchema ───────────────────────────────────────────

describe("AdoptionSchema", () => {
  it("aceita dados mínimos válidos", () => {
    expect(AdoptionSchema.safeParse(adocaoValida()).success).toBe(true);
  });

  it("rejeita pet_id inválido (não UUID)", () => {
    expect(AdoptionSchema.safeParse(adocaoValida({ pet_id: "nao-uuid" })).success).toBe(false);
  });

  it("rejeita adopter_name curto demais", () => {
    expect(AdoptionSchema.safeParse(adocaoValida({ adopter_name: "X" })).success).toBe(false);
  });

  it("rejeita telefone do adotante curto", () => {
    expect(AdoptionSchema.safeParse(adocaoValida({ adopter_phone: "1234" })).success).toBe(false);
  });

  it("rejeita cidade do adotante de 1 char", () => {
    expect(AdoptionSchema.safeParse(adocaoValida({ adopter_city: "X" })).success).toBe(false);
  });

  it("rejeita data de adoção vazia", () => {
    expect(AdoptionSchema.safeParse(adocaoValida({ adoption_date: "" })).success).toBe(false);
  });

  it("aplica default 'active' quando status ausente", () => {
    const r = AdoptionSchema.safeParse(adocaoValida());
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe("active");
  });

  it("aceita status 'returned'", () => {
    expect(AdoptionSchema.safeParse(adocaoValida({ status: "returned" })).success).toBe(true);
  });

  it("rejeita status inválido", () => {
    expect(AdoptionSchema.safeParse(adocaoValida({ status: "pending" })).success).toBe(false);
  });

  it("aceita follow_up_30_date opcional", () => {
    const r = AdoptionSchema.safeParse(adocaoValida({ follow_up_30_date: "2026-07-01" }));
    expect(r.success).toBe(true);
  });
});

// ── MedicalRecordSchema ──────────────────────────────────────

describe("MedicalRecordSchema", () => {
  const base = { record_date: "2026-06-01", type: "consultation", description: "Consulta de rotina" };

  it("aceita dados mínimos válidos", () => {
    expect(MedicalRecordSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita descrição vazia", () => {
    expect(MedicalRecordSchema.safeParse({ ...base, description: "" }).success).toBe(false);
  });

  it("rejeita tipo inválido", () => {
    expect(MedicalRecordSchema.safeParse({ ...base, type: "checkup" }).success).toBe(false);
  });

  it("aceita todos os tipos válidos", () => {
    for (const type of ["consultation", "surgery", "exam", "treatment", "observation"]) {
      expect(MedicalRecordSchema.safeParse({ ...base, type }).success).toBe(true);
    }
  });

  it("aceita weight_kg coercido", () => {
    const r = MedicalRecordSchema.safeParse({ ...base, weight_kg: "8.3" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.weight_kg).toBe(8.3);
  });

  it("rejeita weight_kg negativo", () => {
    expect(MedicalRecordSchema.safeParse({ ...base, weight_kg: -1 }).success).toBe(false);
  });
});

// ── VaccinationSchema ────────────────────────────────────────

describe("VaccinationSchema", () => {
  const base = { vaccine_name: "V8", applied_date: "2026-06-01" };

  it("aceita dados mínimos válidos", () => {
    expect(VaccinationSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita vaccine_name vazio", () => {
    expect(VaccinationSchema.safeParse({ ...base, vaccine_name: "" }).success).toBe(false);
  });

  it("rejeita applied_date vazia", () => {
    expect(VaccinationSchema.safeParse({ ...base, applied_date: "" }).success).toBe(false);
  });

  it("aceita next_dose_date opcional", () => {
    expect(VaccinationSchema.safeParse({ ...base, next_dose_date: "2026-12-01" }).success).toBe(true);
  });
});

// ── MedicationSchema ─────────────────────────────────────────

describe("MedicationSchema", () => {
  const base = {
    medication_name: "Doxiciclina", dosage: "5mg",
    frequency: "2x ao dia", start_date: "2026-06-01",
  };

  it("aceita dados mínimos válidos", () => {
    expect(MedicationSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita medication_name vazio", () => {
    expect(MedicationSchema.safeParse({ ...base, medication_name: "" }).success).toBe(false);
  });

  it("rejeita dosage vazia", () => {
    expect(MedicationSchema.safeParse({ ...base, dosage: "" }).success).toBe(false);
  });

  it("rejeita frequency vazia", () => {
    expect(MedicationSchema.safeParse({ ...base, frequency: "" }).success).toBe(false);
  });

  it("aplica default false para is_ongoing", () => {
    const r = MedicationSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.is_ongoing).toBe(false);
  });

  it("aceita is_ongoing true", () => {
    const r = MedicationSchema.safeParse({ ...base, is_ongoing: true });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.is_ongoing).toBe(true);
  });
});

// ── calcVaccineBadge ─────────────────────────────────────────

describe("calcVaccineBadge — lógica de badge de vacina", () => {
  it("retorna null quando next_dose_date é null", () => {
    expect(calcVaccineBadge(null, TODAY)).toBeNull();
  });

  it("retorna 'overdue' quando data já passou", () => {
    expect(calcVaccineBadge("2026-06-07", TODAY)).toBe("overdue");
  });

  it("retorna 'overdue' quando data é hoje", () => {
    expect(calcVaccineBadge(TODAY, TODAY)).toBe("overdue");
  });

  it("retorna 'warning' quando vence em 1 dia", () => {
    expect(calcVaccineBadge("2026-06-09", TODAY)).toBe("warning");
  });

  it("retorna 'warning' quando vence em 30 dias (limite)", () => {
    expect(calcVaccineBadge("2026-07-08", TODAY)).toBe("warning");
  });

  it("retorna null quando vence em 31 dias (além do limite)", () => {
    expect(calcVaccineBadge("2026-07-09", TODAY)).toBeNull();
  });

  it("retorna null quando vence em 90 dias", () => {
    expect(calcVaccineBadge("2026-09-05", TODAY)).toBeNull();
  });
});

// ── isFollowUp30Overdue ──────────────────────────────────────

describe("isFollowUp30Overdue — follow-up 30 dias atrasado", () => {
  it("retorna false quando follow_up_30_date já foi registrado", () => {
    expect(isFollowUp30Overdue("2026-05-01", "2026-06-01", TODAY)).toBe(false);
  });

  it("retorna false quando adoção tem menos de 30 dias", () => {
    expect(isFollowUp30Overdue("2026-05-20", null, TODAY)).toBe(false);
  });

  it("retorna true quando adoção tem exatamente 30 dias", () => {
    expect(isFollowUp30Overdue("2026-05-09", null, TODAY)).toBe(true);
  });

  it("retorna true quando adoção tem mais de 30 dias", () => {
    expect(isFollowUp30Overdue("2026-04-01", null, TODAY)).toBe(true);
  });

  it("retorna false quando follow_up registrado mesmo com adoção antiga", () => {
    expect(isFollowUp30Overdue("2026-01-01", "2026-02-15", TODAY)).toBe(false);
  });
});

// ── isFollowUp90Overdue ──────────────────────────────────────

describe("isFollowUp90Overdue — follow-up 90 dias atrasado", () => {
  it("retorna false quando follow_up_90_date já foi registrado", () => {
    expect(isFollowUp90Overdue("2026-01-01", "2026-04-05", TODAY)).toBe(false);
  });

  it("retorna false quando adoção tem menos de 90 dias", () => {
    expect(isFollowUp90Overdue("2026-05-01", null, TODAY)).toBe(false);
  });

  it("retorna true quando adoção tem exatamente 90 dias", () => {
    expect(isFollowUp90Overdue("2026-03-10", null, TODAY)).toBe(true);
  });

  it("retorna true quando adoção tem mais de 90 dias", () => {
    expect(isFollowUp90Overdue("2026-01-01", null, TODAY)).toBe(true);
  });

  it("retorna false quando adoção tem 89 dias (um dia antes)", () => {
    expect(isFollowUp90Overdue("2026-03-11", null, TODAY)).toBe(false);
  });
});
