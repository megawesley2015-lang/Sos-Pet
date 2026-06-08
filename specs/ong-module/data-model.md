# Data Model — Módulo ONG
# SDD Fase 2: PLANEJAR (COMO — decisões técnicas de dados)
# ─────────────────────────────────────────────────────────

## Diagrama de Relacionamentos

```
auth.users (Supabase)
    │
    └─► shelters           (1 shelter por user_id — DEC-ONG-01)
            │
            └─► shelter_pets    (N pets por shelter)
                    │
                    ├─► medical_records   (prontuário)
                    ├─► vaccinations      (vacinas + próxima dose)
                    ├─► medications       (medicações contínuas ou temporárias)
                    └─► adoptions         (adoções — preservadas após status=adopted, DEC-ONG-02)
```

## Tabelas

### shelters
| Coluna | Tipo | Restrições | Notas |
|--------|------|-----------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| user_id | UUID | FK auth.users ON DELETE CASCADE, NOT NULL | 1 shelter / user |
| name | TEXT | NOT NULL | |
| type | TEXT | CHECK IN ('ong','protetor') | |
| cnpj | TEXT | nullable | Opcional para protetores |
| phone | TEXT | NOT NULL | |
| email | TEXT | | |
| city | TEXT | NOT NULL | |
| neighborhood | TEXT | | |
| description | TEXT | | |
| logo_url | TEXT | | Storage: bucket shelters-logos |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | trigger auto-update |

**RLS:**
- SELECT: owner (`auth.uid() = user_id`)
- INSERT: authenticated, WITH CHECK (`auth.uid() = user_id`)
- UPDATE: authenticated, USING + WITH CHECK (`auth.uid() = user_id`)
- DELETE: authenticated, USING (`auth.uid() = user_id`)

### shelter_pets
| Coluna | Tipo | Restrições | Notas |
|--------|------|-----------|-------|
| id | UUID | PK | |
| shelter_id | UUID | FK shelters ON DELETE CASCADE | |
| name | TEXT | nullable | Pet pode não ter nome |
| species | TEXT | CHECK IN ('dog','cat','other') | |
| breed | TEXT | | |
| color | TEXT | NOT NULL | |
| size | TEXT | CHECK IN ('small','medium','large') | |
| sex | TEXT | CHECK IN ('male','female','unknown') | |
| estimated_age | TEXT | | |
| rescue_date | DATE | NOT NULL DEFAULT CURRENT_DATE | |
| rescue_location | TEXT | | |
| health_status | TEXT | CHECK IN ('healthy','recovering','critical','treated') | |
| behavior | TEXT | | |
| description | TEXT | | |
| photo_url | TEXT | | Storage: bucket pet-images |
| status | TEXT | CHECK IN ('available','fostered','adopted','deceased') | |
| weight_kg | NUMERIC(5,2) | | |
| microchip | TEXT | | |
| is_castrated | BOOLEAN | DEFAULT false | |

**RLS via is_shelter_owner(shelter_id) — DEC-ONG-03**

### medical_records
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | UUID | PK |
| pet_id | UUID | FK shelter_pets |
| record_type | TEXT | 'consultation','surgery','exam','treatment' |
| description | TEXT | NOT NULL |
| record_date | DATE | NOT NULL |
| professional | TEXT | Veterinário responsável |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |

### vaccinations
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | UUID | PK |
| pet_id | UUID | FK shelter_pets |
| vaccine_name | TEXT | NOT NULL |
| batch_number | TEXT | |
| applied_date | DATE | NOT NULL |
| next_dose_date | DATE | nullable — calculado automaticamente |
| professional | TEXT | |
| notes | TEXT | |

### medications
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | UUID | PK |
| pet_id | UUID | FK shelter_pets |
| name | TEXT | NOT NULL |
| dosage | TEXT | Ex: "5mg" |
| frequency | TEXT | Ex: "2x ao dia" |
| start_date | DATE | NOT NULL |
| end_date | DATE | NULL = medicação contínua |
| notes | TEXT | |

### adoptions
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | UUID | PK |
| shelter_id | UUID | FK shelters |
| pet_id | UUID | FK shelter_pets |
| adopter_name | TEXT | NOT NULL |
| adopter_contact | TEXT | NOT NULL |
| adoption_date | DATE | NOT NULL DEFAULT CURRENT_DATE |
| notes | TEXT | |
| follow_up_30_date | DATE | NULL até ONG registrar |
| follow_up_30_notes | TEXT | |
| follow_up_90_date | DATE | NULL até ONG registrar |
| follow_up_90_notes | TEXT | |
| created_at | TIMESTAMPTZ | |

**DEC-ONG-04:** Apenas 2 checkpoints fixos. Pós-MVP: tabela separada.

## Índices recomendados

```sql
CREATE INDEX idx_shelter_pets_shelter_id ON shelter_pets(shelter_id);
CREATE INDEX idx_shelter_pets_status ON shelter_pets(status);
CREATE INDEX idx_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX idx_vaccinations_next_dose ON vaccinations(next_dose_date) WHERE next_dose_date IS NOT NULL;
CREATE INDEX idx_adoptions_shelter_id ON adoptions(shelter_id);
CREATE INDEX idx_adoptions_date ON adoptions(adoption_date);
```
