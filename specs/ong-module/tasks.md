# Tasks — Módulo ONG
# SDD Fase 3: DECOMPOR (micro-tarefas independentes e verificáveis)
# Notação: EARS por tarefa + Harness Command + Critério de Aceite
# ─────────────────────────────────────────────────────────────────
# Status geral: ✅ Código implementado | ⚠️ Migration pendente no Supabase
# Referências: spec.md · data-model.md · contracts.md
# Pipeline SDD: Specify → Plan → Decompose → Implement & Verify
# ─────────────────────────────────────────────────────────────────

---

## BLOQUEADOR CRÍTICO — Resolver primeiro

> Nenhuma rota ONG funciona em produção sem as tabelas no Supabase.
> A migration `001_ong_module.sql` está escrita mas NÃO foi aplicada.

---

## T1 — Aplicar migration ONG no Supabase [BLOQUEADOR]

**Fase SDD:** Implementar & Verificar
**Status:** ⚠️ Pendente
**Arquivo:** `supabase/migrations/001_ong_module.sql`

### Especificação EARS

WHEN o dev executar `supabase db push` no ambiente de produção
THE SYSTEM SHALL criar as tabelas: shelters, shelter_pets, medical_records,
vaccinations, medications, adoptions — idempotente (IF NOT EXISTS).

THE SYSTEM SHALL criar a função RLS `is_shelter_owner(shelter_id UUID)`
e aplicá-la como SECURITY DEFINER para evitar recursão de política.

IF qualquer tabela já existir
THEN THE SYSTEM SHALL pular a criação sem erro (idempotente).

IF a função `is_shelter_owner` já existir
THEN THE SYSTEM SHALL substituí-la via `CREATE OR REPLACE`.

### Harness Commands

```bash
# Aplicar migration
supabase db push

# Verificar tabelas criadas
supabase db execute --stdin <<'SQL'
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('shelters','shelter_pets','medical_records',
                     'vaccinations','medications','adoptions')
ORDER BY table_name;
SQL

# Verificar função RLS
supabase db execute --stdin <<'SQL'
SELECT proname FROM pg_proc WHERE proname = 'is_shelter_owner';
SQL

# Verificar RLS habilitada
supabase db execute --stdin <<'SQL'
SELECT relname, relrowsecurity FROM pg_class
WHERE relname IN ('shelters','shelter_pets','medical_records',
                  'vaccinations','medications','adoptions');
SQL
```

### Critério de Aceite

- [ ] 6 tabelas retornadas na query de verificação
- [ ] `is_shelter_owner` presente em `pg_proc`
- [ ] `relrowsecurity = true` para todas as 6 tabelas
- [ ] `supabase db push` retorna sem erros
- [ ] TypeScript: `npx supabase gen types typescript --project-id enpgqgqinbdbvkqtnria > lib/types/database.ts` gera sem erro

---

## T2 — Verificar RLS do módulo ONG [BLOQUEADOR]

**Fase SDD:** Implementar & Verificar
**Status:** ⚠️ Depende de T1
**Arquivo:** `supabase/migrations/001_ong_module.sql`

### Especificação EARS

THE SYSTEM SHALL garantir que cada tabela tenha exatamente as políticas definidas
na spec (SELECT, INSERT, UPDATE, DELETE) — sem política catch-all aberta.

IF um usuário autenticado tentar acessar `shelter_pets` de outro shelter via REST
THEN THE SYSTEM SHALL retornar 0 rows (RLS bloqueia, sem erro 403).

IF um usuário não autenticado tentar acessar qualquer tabela ONG via REST
THEN THE SYSTEM SHALL retornar 0 rows (sem policy para anon).

### Harness Commands

```bash
# Listar políticas ativas por tabela
supabase db execute --stdin <<'SQL'
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('shelters','shelter_pets','medical_records',
                    'vaccinations','medications','adoptions')
ORDER BY tablename, cmd;
SQL
```

### Critério de Aceite

- [ ] Cada tabela tem pelo menos 2 políticas (SELECT + INSERT/UPDATE/DELETE)
- [ ] Nenhuma política usa `USING (true)` em tabelas privadas ONG
- [ ] `shelters`: SELECT limitado a `auth.uid() = user_id`
- [ ] `shelter_pets`: usa `is_shelter_owner(shelter_id)` nas políticas
- [ ] Typecheck passa: `npm run typecheck`

---

## T3 — Dashboard operacional com métricas reais

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Código existe em `app/ong/dashboard/page.tsx`
**Depende de:** T1, T2

### Especificação EARS

WHEN uma ONG autenticada acessa `/ong/dashboard`
THE SYSTEM SHALL exibir 7 métricas calculadas via queries separadas ao Supabase:
  1. Pets ativos (status IN ('available','fostered'))
  2. Total de adoções (status = 'adopted')
  3. Pets críticos (health_status = 'critical')
  4. Medicações contínuas (end_date IS NULL OR end_date > TODAY)
  5. Total de registros de prontuário
  6. Vacinas vencendo ≤ 30 dias (next_dose_date BETWEEN TODAY AND TODAY+30)
  7. Follow-ups atrasados (adoption_date + 30 dias < TODAY AND follow_up_30_date IS NULL)

WHILE os dados estiverem sendo carregados via Server Component
THE SYSTEM SHALL exibir `app/ong/dashboard/loading.tsx` com skeletons animados.

IF o shelter ainda não tiver pets cadastrados
THE SYSTEM SHALL exibir estado vazio com CTA para `/ong/pets/novo`.

### Harness Commands

```bash
npm run typecheck
npm run build
# Manual: acessar /ong/dashboard com usuário autenticado + shelter cadastrado
```

### Critério de Aceite

- [ ] Métricas carregam com dados reais após T1 aplicada
- [ ] Skeleton aparece durante carregamento (testar com `?delay=true` ou network throttle)
- [ ] Estado vazio mostra CTA quando shelter não tem pets
- [ ] Nenhum dado de outro shelter aparece para usuário diferente
- [ ] Build passa sem warnings

---

## T4 — Cadastro e edição de pets do abrigo

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Código existe em `app/ong/pets/novo/` e `app/ong/pets/[id]/editar/`
**Depende de:** T1, T2

### Especificação EARS

WHEN a ONG acessa `/ong/pets/novo` e submete formulário com dados válidos
THE SYSTEM SHALL criar entry em `shelter_pets` com `shelter_id` do shelter
da ONG autenticada e redirecionar para `/ong/pets/[id]`.

IF os campos obrigatórios `color`, `size`, `sex` ou `species` estiverem ausentes
THEN THE SYSTEM SHALL bloquear o submit e exibir erro inline por campo.

WHEN a ONG altera `status` de um pet para `adopted` via `/ong/pets/[id]/editar`
THE SYSTEM SHALL verificar se existe uma adoção em `adoptions` para esse `pet_id`
antes de persistir a mudança — IF não existir THEN bloquear com mensagem orientativa.

### Harness Commands

```bash
npm run typecheck
# Verificar actions com Zod
grep -r "z.object" app/ong/pets/ --include="*.ts"
```

### Critério de Aceite

- [ ] Cadastro com campos obrigatórios ausentes não submete
- [ ] Pet criado aparece em `/ong/pets` com status correto
- [ ] Alteração de status para `adopted` sem adoção previa é bloqueada
- [ ] `actions.ts` usa `const { id } = await params` (Next.js 15+ pattern)
- [ ] Typecheck passa

---

## T5 — Prontuário veterinário (medical_records)

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Código existe em `app/ong/pets/[id]/prontuario/`
**Depende de:** T1, T2

### Especificação EARS

WHEN a ONG acessa `/ong/pets/[id]/prontuario`
THE SYSTEM SHALL listar todos os registros de `medical_records` para esse `pet_id`
ordenados por `record_date DESC`.

WHEN a ONG submete o formulário `AddMedicalRecordForm`
THE SYSTEM SHALL criar entry em `medical_records` com: `record_type`, `description`,
`record_date`, `professional` e retornar `{ success: true, data: {...} }`.

IF o `pet_id` não pertencer ao shelter da ONG autenticada
THEN THE SYSTEM SHALL retornar 404 (RLS bloqueia sem revelar existência).

THE SYSTEM SHALL preservar prontuário mesmo após pet adotado
(status `adopted` não dispara DELETE em cascade para `medical_records`).

### Harness Commands

```bash
npm run typecheck
# Verificar que ON DELETE CASCADE não está em medical_records→shelter_pets
grep -A2 "medical_records" supabase/migrations/001_ong_module.sql
```

### Critério de Aceite

- [ ] Listagem mostra registros ordenados por data DESC
- [ ] Novo registro aparece imediatamente após submit (revalidatePath)
- [ ] Pet com status `adopted` ainda exibe seu prontuário
- [ ] Acesso a `pet_id` de outro shelter retorna 404
- [ ] Typecheck passa

---

## T6 — Vacinas com badges de alerta

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Código existe em `app/ong/pets/[id]/vacinas/`
**Depende de:** T1, T2

### Especificação EARS

WHEN a ONG acessa `/ong/pets/[id]/vacinas`
THE SYSTEM SHALL listar todas as vacinas com: `vaccine_name`, `applied_date`,
`next_dose_date` e badge de status calculado no render.

WHEN `next_dose_date` estiver entre TODAY e TODAY + 30 dias (inclusive)
THE SYSTEM SHALL exibir badge laranja "⚠️ Vence em X dias".

IF `next_dose_date` for anterior a TODAY
THEN THE SYSTEM SHALL exibir badge vermelho "🔴 Atrasada".

WHEN a ONG submete `AddVaccineForm` com dados válidos
THE SYSTEM SHALL criar entry em `vaccinations` e atualizar a listagem.

### Harness Commands

```bash
npm run typecheck
# Verificar lógica de badge no componente
grep -n "next_dose_date\|Atrasada\|Vence em" app/ong/pets/\[id\]/vacinas/page.tsx
```

### Critério de Aceite

- [ ] Vacina com `next_dose_date` = HOJE+10 exibe badge laranja
- [ ] Vacina com `next_dose_date` = HOJE-5 exibe badge vermelho
- [ ] Vacina sem `next_dose_date` não exibe badge
- [ ] Quantidade de vacinas vencendo ≤ 30 dias bate com métrica do dashboard (T3)
- [ ] Typecheck passa

---

## T7 — Medicações (contínuas e temporárias)

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Código existe em `app/ong/pets/[id]/medicacoes/`
**Depende de:** T1, T2

### Especificação EARS

WHEN a ONG acessa `/ong/pets/[id]/medicacoes`
THE SYSTEM SHALL listar medicações divididas em: Ativas e Histórico.
Ativas = `end_date IS NULL OR end_date >= TODAY`.
Histórico = `end_date < TODAY`.

WHEN uma medicação tiver `end_date = NULL`
THE SYSTEM SHALL exibi-la com label "Contínua" e contabilizá-la na
métrica de medicações contínuas do dashboard.

WHEN a ONG submete `AddMedicationForm` com dados válidos
THE SYSTEM SHALL criar entry em `medications` e revalidar a listagem.

### Harness Commands

```bash
npm run typecheck
# Verificar lógica de ativas/histórico
grep -n "end_date\|Contínua\|Histórico" app/ong/pets/\[id\]/medicacoes/page.tsx
```

### Critério de Aceite

- [ ] Medicação com `end_date = NULL` aparece em Ativas com label "Contínua"
- [ ] Medicação com `end_date` no passado aparece em Histórico
- [ ] Contagem de medicações contínuas bate com dashboard (T3)
- [ ] Typecheck passa

---

## T8 — Processo de adoção + webhook n8n

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Código existe em `app/ong/adocoes/`
**Depende de:** T1, T2

### Especificação EARS

WHEN a ONG registra uma adoção via `/ong/adocoes/novo` com dados válidos
THE SYSTEM SHALL criar entry em `adoptions` com: `pet_id`, `shelter_id`,
`adopter_name`, `adopter_contact`, `adoption_date` e notas.

WHEN a adoção for criada com sucesso
THE SYSTEM SHALL disparar POST assíncrono para o webhook n8n com payload:
```json
{
  "event": "adoption_created",
  "adoption_id": "uuid",
  "pet_id": "uuid",
  "shelter_id": "uuid",
  "adopter_contact": "...",
  "adoption_date": "YYYY-MM-DD"
}
```

IF o webhook n8n falhar (timeout, 4xx, 5xx)
THEN THE SYSTEM SHALL logar a falha sem interromper o fluxo do usuário —
a adoção DEVE estar criada independentemente do webhook.

WHEN uma adoção é criada com sucesso
THE SYSTEM SHALL atualizar o `status` do `shelter_pets` correspondente para `adopted`.

### Harness Commands

```bash
npm run typecheck
# Verificar se webhook está implementado nas actions
grep -n "webhook\|n8n\|fetch" app/ong/adocoes/actions.ts
# Verificar atualização de status do pet
grep -n "adopted\|shelter_pets" app/ong/adocoes/actions.ts
```

### Critério de Aceite

- [ ] Adoção criada aparece em `/ong/adocoes` com data e nome do adotante
- [ ] Pet correspondente tem status `adopted` após adoção
- [ ] Webhook dispara (verificar logs n8n ou webhook.site em dev)
- [ ] Se webhook falhar, adoção ainda é criada (testar com URL inválida)
- [ ] Typecheck passa

---

## T9 — Follow-up de adoção (30 e 90 dias)

**Fase SDD:** Implementar & Verificar
**Status:** ✅ Código existe em `app/ong/adocoes/[id]/page.tsx`
**Depende de:** T8

### Especificação EARS

WHEN a ONG acessa `/ong/adocoes/[id]`
THE SYSTEM SHALL exibir status dos follow-ups 30 e 90 dias com badge visual:
  - NULL + prazo não vencido → badge cinza "Pendente"
  - NULL + prazo vencido → badge vermelho "🔴 Atrasado"
  - Preenchido → badge verde "✅ Realizado em [data]"

WHEN a adoção completar 30 dias sem `follow_up_30_date` preenchido
THE SYSTEM SHALL exibir badge "🔴 Follow-up 30d atrasado" na listagem `/ong/adocoes`.

WHEN a ONG preenche `follow_up_30_date` ou `follow_up_90_date`
THE SYSTEM SHALL persistir a data e as notas via PATCH em `adoptions`
e reexibir os badges atualizados.

### Harness Commands

```bash
npm run typecheck
# Verificar lógica de badges na listagem
grep -n "follow_up\|Atrasado\|Realizado" app/ong/adocoes/page.tsx
# Verificar action de update
grep -n "follow_up" app/ong/adocoes/actions.ts
```

### Critério de Aceite

- [ ] Adoção com 31+ dias e `follow_up_30_date = NULL` mostra badge vermelho
- [ ] Adoção com `follow_up_30_date` preenchido mostra badge verde
- [ ] Preenchimento de follow-up persiste no Supabase e badges atualizam
- [ ] Métrica de follow-ups atrasados no dashboard (T3) bate com listagem
- [ ] Typecheck passa

---

## T10 — Gerar tipos TypeScript do Supabase

**Fase SDD:** Implementar & Verificar
**Status:** ⚠️ Pendente (depende de T1)
**Depende de:** T1

### Especificação EARS

WHEN as tabelas ONG estiverem criadas no Supabase
THE SYSTEM SHALL ter tipos gerados em `lib/types/database.ts` cobrindo
as tabelas: shelters, shelter_pets, medical_records, vaccinations,
medications, adoptions.

### Harness Command

```bash
npx supabase gen types typescript \
  --project-id enpgqgqinbdbvkqtnria \
  > lib/types/database.ts

npm run typecheck
```

### Critério de Aceite

- [ ] `database.ts` gerado sem erros
- [ ] Tipos `Database['public']['Tables']['shelters']['Row']` disponíveis
- [ ] Nenhum `any` não justificado em `app/ong/**/*.ts`
- [ ] `npm run typecheck` passa limpo

---

## Ordem de Execução

```
T1 (migration) → T2 (RLS verify) → T10 (tipos) → T3–T9 (features)

T3, T4, T5, T6, T7 podem rodar em paralelo após T1+T2+T10.
T8 depende de T4 (pet deve existir).
T9 depende de T8 (adoção deve existir).
```

## Harness Global

```bash
# Após qualquer tarefa concluída:
npm run typecheck && npm run build

# Linha de status rápida:
echo "TypeScript: $(npx tsc --noEmit 2>&1 | grep -c 'error' || echo 0) erros"
```

---

*Gerado via SDD Fase 3 | Atualizar status de cada task conforme completada*
*Referências: spec.md · data-model.md · contracts.md · .specify/memory/constitution.md*
