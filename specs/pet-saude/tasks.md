# Tasks — Histórico de Saúde do Pet
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md

---

## T1 — Migration SQL: tabelas de saúde para pets de tutores

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `supabase/migrations/20260610_pet_health_tables.sql` (novo)

### Especificação EARS
THE SYSTEM SHALL criar `pet_vaccinations`, `pet_medications`, `pet_health_records`
vinculadas a `pets.id` com RLS completo.

### O que fazer
1. Criar `pet_vaccinations`: `id UUID PK`, `pet_id UUID → pets(id) ON DELETE CASCADE`,
   `owner_id UUID → auth.users(id) ON DELETE CASCADE`, `vaccine_name TEXT NOT NULL`,
   `applied_at DATE NOT NULL`, `next_due_at DATE`, `veterinarian TEXT`, `clinic TEXT`,
   `notes TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW()`
2. Criar `pet_medications`: `id UUID PK`, `pet_id UUID → pets(id)`, `owner_id UUID → auth.users(id)`,
   `medication_name TEXT NOT NULL`, `dosage TEXT NOT NULL`, `frequency TEXT NOT NULL`,
   `start_date DATE NOT NULL`, `end_date DATE`, `status TEXT CHECK IN ('active','completed')`,
   `notes TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW()`
3. Criar `pet_health_records`: `id UUID PK`, `pet_id UUID → pets(id)`, `owner_id UUID → auth.users(id)`,
   `visit_date DATE NOT NULL`, `reason TEXT NOT NULL`, `diagnosis TEXT`, `treatment TEXT`,
   `veterinarian TEXT`, `clinic TEXT`, `weight_kg DECIMAL(5,2)`, `notes TEXT`,
   `created_at TIMESTAMPTZ DEFAULT NOW()`
4. ENABLE ROW LEVEL SECURITY em todas as 3 tabelas
5. Políticas RLS:
   - `pet_vaccinations`: SELECT PUBLIC (true); INSERT/UPDATE/DELETE auth.uid() = owner_id
   - `pet_medications`: SELECT/INSERT/UPDATE/DELETE auth.uid() = owner_id (privado)
   - `pet_health_records`: SELECT/INSERT/UPDATE/DELETE auth.uid() = owner_id (privado)
6. Índices: `(pet_id)`, `(owner_id)`, `(applied_at DESC)` em vaccinations;
   `(pet_id, status)` em medications; `(pet_id, visit_date DESC)` em health_records

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] Migration idempotente (CREATE TABLE IF NOT EXISTS)
- [ ] RLS: tutor B não consegue SELECT em pet_medications do tutor A
- [ ] RLS: SELECT público em pet_vaccinations retorna registros sem autenticação
- [ ] Todos os índices criados

---

## T2 — Atualizar tipos TypeScript em `lib/types/database.ts`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `lib/types/database.ts`

### O que fazer
1. Substituir a interface manual `PetSaudeRow` pelas interfaces derivadas das novas tabelas
2. Adicionar `PetVaccinationRow`, `PetMedicationRow`, `PetHealthRecordRow` com todos os campos
3. Adicionar tipos de insert: `PetVaccinationInsert`, `PetMedicationInsert`, `PetHealthRecordInsert`
4. Manter compatibilidade com `PetSaudeRow` existente (alias ou deprecação comentada)

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] Nenhum `any` nos novos tipos
- [ ] `PetSaudeRow` existente não quebra código que já a usa
- [ ] `npm run typecheck` sem erros

---

## T3 — Schemas Zod de validação para saúde

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `lib/validation/pet-saude.ts` (novo)

### O que fazer
1. Schema `vaccinationSchema`: `vaccine_name` (min 2 chars), `applied_at` (date, não futura),
   `next_due_at` (date opcional, deve ser após `applied_at`), `veterinarian`, `clinic`, `notes` (opcionais)
2. Schema `medicationSchema`: `medication_name`, `dosage`, `frequency` (required),
   `start_date`, `end_date` (opcional, deve ser >= `start_date`), `notes`
3. Schema `healthRecordSchema`: `visit_date` (não futura), `reason` (min 3 chars),
   `diagnosis`, `treatment`, `weight_kg` (opcional, entre 0.1 e 200), etc.
4. Exportar tipos inferidos: `VaccinationInput`, `MedicationInput`, `HealthRecordInput`

### Harness Commands
```bash
npm run typecheck
npx vitest run pet-saude
```

### Critério de Aceite
- [ ] `vaccinationSchema.parse({ applied_at: '2099-01-01' })` lança ZodError
- [ ] `medicationSchema.parse({ end_date: '2020-01-01', start_date: '2025-01-01' })` lança ZodError
- [ ] Schemas tipados sem `any`
- [ ] `npm run typecheck` sem erros

---

## T4 — API Routes de saúde (`/api/pets/[id]/health/...`)

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:**
- `app/api/pets/[id]/health/vaccinations/route.ts` (novo)
- `app/api/pets/[id]/health/medications/route.ts` (novo)
- `app/api/pets/[id]/health/records/route.ts` (novo)

### Especificação EARS
WHEN o tutor submete formulário de nova vacina
THE SYSTEM SHALL salvar em `pet_vaccinations` e retornar `{ success: true, data: vaccination }`.

### O que fazer
Para cada route (vaccinations, medications, records):
1. `GET`: verificar que `pet_id` pertence ao `auth.uid()` (via Supabase); retornar lista ordenada
2. `POST`: validar body com Zod schema; verificar ownership do pet; inserir; retornar item criado
3. `DELETE /api/pets/[id]/health/vaccinations/[vaccinationId]`: verificar ownership; deletar
4. Usar `await params` (Next.js 15+): `const { id } = await params`
5. Rate limiting: `checkRateLimit` nos POST com chave `pet-health:{userId}`
6. Respostas: `ok()` e `fail()` de `@/lib/api-response`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `POST /api/pets/[id]/health/vaccinations` com `applied_at` futuro retorna 422
- [ ] `POST` sem autenticação retorna 401
- [ ] `GET` retorna lista ordenada por data DESC
- [ ] `DELETE` de vacina de outro tutor retorna 403
- [ ] `npm run typecheck` sem erros

---

## T5 — Páginas de saúde em `/meus-pets/[id]/saude/`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:**
- `app/meus-pets/[id]/saude/vacinas/page.tsx` (novo)
- `app/meus-pets/[id]/saude/medicamentos/page.tsx` (novo)
- `app/meus-pets/[id]/saude/prontuario/page.tsx` (novo)

### O que fazer
1. Cada página é Server Component que busca dados via API route ou Supabase direto
2. Verificar ownership do pet; redirecionar para `/meus-pets` se pet não pertencer ao usuário
3. Formulário inline (Client Component) para adicionar novo registro
4. Lista de registros existentes com botão excluir
5. Layout com tabs/nav entre "Vacinas", "Medicamentos", "Prontuário"
6. Usar design system: `bg-bg`, `text-fg`, `bg-primary` para botões

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Acesso sem autenticação redireciona para `/login`
- [ ] Pet de outro tutor retorna 404 ou redireciona
- [ ] Formulário de vacina valida client-side e server-side
- [ ] Lista atualiza após adicionar novo registro
- [ ] `npm run build` sem erros

---

## T6 — Exibir vacinas no perfil público `/pets/[id]`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/(public)/pets/[id]/page.tsx`

### Especificação EARS
WHEN um visitante acessa `/pets/[id]`
THE SYSTEM SHALL exibir vacinas com apenas `vaccine_name` e `applied_at`,
sem expor veterinário, clínica ou notas.

### O que fazer
1. Na query existente de `/pets/[id]`, adicionar JOIN ou query separada em
   `pet_vaccinations` com `select('vaccine_name, applied_at')` ordenado por `applied_at DESC`
2. Renderizar seção "Carteira de Vacinação" com chips/badges para cada vacina
3. Se não há vacinas, exibir "Carteira de vacinação não informada"
4. Nunca incluir `veterinarian`, `clinic`, `notes` no select público

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Vacinas aparecem em `/pets/[id]` sem dados de veterinário
- [ ] Select usa colunas explícitas (não *)
- [ ] Pet sem vacinas exibe mensagem adequada
- [ ] `npm run typecheck` sem erros

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T5 → T6

**Dependências:**
- T2 depende de T1 (schema define os tipos)
- T3 pode ser feito em paralelo com T2
- T4 depende de T1, T2, T3
- T5 depende de T4
- T6 depende de T1 (tabela precisa existir)

## Harness Global

```bash
npm run typecheck
npx vitest run pet-saude
npm run build
```

