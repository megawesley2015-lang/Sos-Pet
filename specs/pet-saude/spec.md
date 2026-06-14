# Spec — Histórico de Saúde do Pet
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: pet-saude
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

Tutores de pets precisam registrar o histórico de saúde dos seus animais: vacinas aplicadas,
medicamentos em uso e prontuário de consultas. Hoje, o módulo ONG já tem tabelas
`vaccinations`, `medications` e `medical_records` mas vinculadas a `shelter_pets` (pets de
abrigo). Tutores com pets cadastrados na tabela `pets` (achados e perdidos) não têm acesso a
esse recurso. A interface manual `PetSaudeRow` já existe em `lib/types/database.ts` mas não
tem migration SQL correspondente — falta criar as tabelas e o CRUD. Isso aumenta retenção
(tutores voltam ao app para consultar saúde) e prepara a base para lembretes de vacina (futuro).

## Estado Atual

| Item | Status |
|---|---|
| Interface `PetSaudeRow` em `lib/types/database.ts` | Existe (manual, sem migration) |
| Tabelas `vaccinations`, `medications`, `medical_records` | Existem mas ligadas a `shelter_pets` |
| CRUD de saúde para pets de tutores (`pets`) | Não existe |
| Rotas `/ong/pets/[id]/vacinas`, `/ong/pets/[id]/medicacoes`, `/ong/pets/[id]/prontuario` | Existem (só para ONG) |
| Rota `/meus-pets/[id]/saude` | Não existe |
| API routes de saúde para tutores | Não existem |

## Requisitos — Notação EARS

### 2.1 Tabelas de Saúde para Pets de Tutores

WHEN o sistema realiza a migration de pet-saude
THE SYSTEM SHALL criar as tabelas `pet_vaccinations`, `pet_medications` e
`pet_health_records` vinculadas a `pets.id` (não a `shelter_pets`).

THE SYSTEM SHALL habilitar RLS em todas as novas tabelas.

THE SYSTEM SHALL garantir que apenas o `owner_id` do pet correspondente possa
INSERT/UPDATE/DELETE nos registros de saúde.

THE SYSTEM SHALL permitir SELECT público em `pet_vaccinations` para exibição no
perfil público do pet em `/pets/[id]`.

### 2.2 Cadastro de Vacina

WHEN o tutor acessa `/meus-pets/[id]/saude/vacinas`
THE SYSTEM SHALL exibir a lista de vacinas registradas para o pet, ordenadas por
`applied_at DESC`.

WHEN o tutor submete o formulário de nova vacina com `vaccine_name`, `applied_at` e
opcionalmente `next_due_at`, `veterinarian`, `clinic`, `notes`
THE SYSTEM SHALL salvar o registro em `pet_vaccinations` com `pet_id` e `owner_id`.

IF `applied_at` for uma data futura
THEN THE SYSTEM SHALL retornar erro 422 com `{ success: false, error: "Data de aplicação não pode ser futura" }`.

IF `vaccine_name` estiver vazio
THEN THE SYSTEM SHALL retornar erro 422 com `{ success: false, error: "Nome da vacina é obrigatório" }`.

WHEN o tutor clica em excluir uma vacina
THE SYSTEM SHALL remover o registro somente se `owner_id = auth.uid()`.

### 2.3 Cadastro de Medicamento

WHEN o tutor submete o formulário de medicamento com `medication_name`, `dosage`,
`frequency`, `start_date` e opcionalmente `end_date`, `notes`
THE SYSTEM SHALL salvar o registro em `pet_medications`.

IF `end_date` for anterior a `start_date`
THEN THE SYSTEM SHALL retornar erro 422 com `{ success: false, error: "Data de término não pode ser anterior ao início" }`.

WHEN o tutor marca um medicamento como concluído
THE SYSTEM SHALL setar `end_date = today` e `status = 'completed'`.

### 2.4 Prontuário / Consultas

WHEN o tutor submete uma consulta com `visit_date`, `reason`, `diagnosis`,
`treatment` e opcionalmente `veterinarian`, `clinic`, `weight_kg`, `notes`
THE SYSTEM SHALL salvar o registro em `pet_health_records`.

WHEN o tutor acessa o prontuário do pet
THE SYSTEM SHALL exibir registros ordenados por `visit_date DESC`.

IF `visit_date` for uma data futura
THEN THE SYSTEM SHALL retornar erro 422 com `{ success: false, error: "Data da consulta não pode ser futura" }`.

### 2.5 Exibição no Perfil Público

WHEN um visitante acessa `/pets/[id]`
THE SYSTEM SHALL exibir as vacinas do pet (apenas `vaccine_name` e `applied_at`), sem
expor dados de veterinário, clínica ou notas.

---

## Critérios de Aceitação

- [ ] Migration SQL cria `pet_vaccinations`, `pet_medications`, `pet_health_records` com RLS
- [ ] RLS impede que tutor B veja/edite saúde do pet do tutor A
- [ ] SELECT público em `pet_vaccinations` mostra apenas `vaccine_name`, `applied_at`
- [ ] Formulário de vacina valida data futura (422)
- [ ] Formulário de medicamento valida `end_date < start_date` (422)
- [ ] Rota `/meus-pets/[id]/saude/vacinas` lista vacinas do pet logado
- [ ] Rota `/pets/[id]` exibe vacinas sem dados sensíveis
- [ ] `npm run typecheck` sem erros
