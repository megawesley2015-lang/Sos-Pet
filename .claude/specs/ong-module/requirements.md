# Requirements — Módulo ONG
# Spec-Driven Development | Fase: Execute (código pronto, migration pendente)

**Slug:** ong-module
**Responsável:** Wes
**Status:** ⚠️ BLOQUEADO — migration 001_ong_module.sql não aplicada no Supabase

---

## Contexto

ONGs e protetores independentes resgatam pets, gerenciam lares temporários
e encaminham para adoção. Hoje fazem isso via planilha ou memória.
O módulo ONG dá a eles um sistema web completo integrado ao SOS Pet Aumigo.

---

## Requisitos funcionais (EARS notation)

### Cadastro

WHEN uma ONG ou protetor acessa `/ong/cadastro`
THE SYSTEM SHALL exibir formulário com: nome, tipo (ong | protetor), CNPJ (opcional),
telefone, e-mail, cidade, bairro e descrição.

WHEN o formulário é submetido com dados válidos
THE SYSTEM SHALL criar ou atualizar o registro em `shelters` via `upsertShelter`
e redirecionar para `/ong/dashboard`.

WHEN um usuário não autenticado tenta acessar qualquer rota `/ong/*`
THE SYSTEM SHALL redirecionar para `/login?next=/ong/dashboard`.

### Dashboard

WHEN uma ONG autenticada acessa `/ong/dashboard`
THE SYSTEM SHALL exibir as seguintes métricas em tempo real:
  - Total de pets ativos no abrigo (status = available | fostered)
  - Total de adoções realizadas
  - Pets em estado crítico (health_status = critical)
  - Medicações contínuas ativas
  - Total de registros de prontuário
  - Pets com vacina vencendo nos próximos 30 dias
  - Adoções com follow-up 30 ou 90 dias vencidos ou vencendo

### Pets do Abrigo

WHEN a ONG acessa `/ong/pets`
THE SYSTEM SHALL listar todos os pets do shelter com status, espécie e data de resgate.

WHEN a ONG cadastra um novo pet via `/ong/pets/novo`
THE SYSTEM SHALL criar entry em `shelter_pets` com todos os campos de prontuário
(peso, microchip, castrado, comportamento, foto).

WHEN a ONG acessa `/ong/pets/[id]`
THE SYSTEM SHALL exibir o perfil completo do pet com links para prontuário, vacinas e medicações.

### Prontuário

WHEN a ONG acessa `/ong/pets/[id]/prontuario`
THE SYSTEM SHALL listar todos os registros médicos ordenados por data DESC.

WHEN a ONG adiciona um registro via `AddMedicalRecordForm`
THE SYSTEM SHALL criar entry em `medical_records` com: tipo, descrição, veterinário,
peso no momento e notas.

### Vacinas

WHEN a ONG acessa `/ong/pets/[id]/vacinas`
THE SYSTEM SHALL listar vacinas com data aplicada e próxima dose.

WHEN a próxima dose estiver dentro de 30 dias
THE SYSTEM SHALL destacar o item visualmente (badge de alerta).

### Medicações

WHEN a ONG acessa `/ong/pets/[id]/medicacoes`
THE SYSTEM SHALL listar medicações, separando as contínuas das com prazo definido.

### Adoções

WHEN a ONG registra uma adoção via `/ong/adocoes/novo`
THE SYSTEM SHALL:
  1. Criar entry em `adoptions` com dados do adotante
  2. Atualizar `shelter_pets.status` para `adopted`
  3. Redirecionar para `/ong/adocoes`

WHEN uma adoção tem follow-up 30 ou 90 dias pendente
THE SYSTEM SHALL exibir alerta no dashboard e na listagem de adoções.

WHEN a ONG atualiza o follow-up de uma adoção
THE SYSTEM SHALL persistir data, notas e status via `updateFollowUp`.

---

## Fora do escopo desta spec

- Perfil público de ONG (listagem pública — pós-MVP)
- Formulário de interesse do adotante (pós-MVP)
- Relatórios PDF de adoções (pós-MVP)
- Integração com WhatsApp para confirmar follow-up (spec separada: n8n-ong-followup)

---

## Critério de pronto

- [ ] Migration aplicada no Supabase (001_ong_module.sql)
- [ ] `/ong/cadastro` → formulário funciona, grava em `shelters`
- [ ] `/ong/dashboard` → métricas corretas e reais do banco
- [ ] CRUD de pets do abrigo funcional
- [ ] Prontuário, vacinas e medicações funcionando
- [ ] Adoção: criação + mudança de status do pet + follow-up editável
- [ ] RLS: ONG só vê seus próprios dados
