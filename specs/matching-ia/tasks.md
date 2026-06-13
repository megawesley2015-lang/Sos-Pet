# Tasks — Matching Automatizado por IA
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md

---

## T1 — Migration SQL: tabela `pet_matches`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `supabase/migrations/20260610_pet_matches.sql` (novo)

### O que fazer
1. Criar `pet_matches`:
   - `id UUID PK DEFAULT gen_random_uuid()`
   - `lost_pet_id UUID → pets(id) ON DELETE CASCADE NOT NULL`
   - `found_pet_id UUID → pets(id) ON DELETE CASCADE NOT NULL`
   - `confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1) NOT NULL`
   - `status TEXT CHECK IN ('pending','confirmed','dismissed') DEFAULT 'pending'`
   - `matched_by TEXT CHECK IN ('system','user') DEFAULT 'system'`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`
2. UNIQUE constraint em `(lost_pet_id, found_pet_id)`
3. ENABLE ROW LEVEL SECURITY
4. Políticas RLS:
   - SELECT: tutor do pet perdido OU tutor do pet encontrado pode ver o match
     `USING (lost_pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()) OR found_pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()))`
   - INSERT: service_role apenas (CRON n8n usa service_role)
   - UPDATE: tutor do pet perdido pode atualizar status (confirmar/descartar)
5. Trigger `update_updated_at_column` em `updated_at`
6. Índices: `(lost_pet_id)`, `(found_pet_id)`, `(status, confidence_score DESC)`, `(created_at DESC)`

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] UNIQUE constraint impede duplicatas
- [ ] RLS: usuário não vê matches que não envolvem seus pets
- [ ] `confidence_score` rejeita valores fora de 0–1

---

## T2 — Função de scoring em TypeScript

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `lib/matching/score.ts` (novo)

### Especificação EARS
THE SYSTEM SHALL calcular score entre dois pets com critérios definidos na spec.

### O que fazer
1. Criar função pura `calculateMatchScore(lost: PetForMatching, found: PetForMatching): number`
2. Tipo `PetForMatching`: `{ id, species, city, color, breed, latitude?, longitude?, created_at }`
3. Se `lost.species !== found.species`: retornar 0 imediatamente
4. Pontuar conforme spec:
   - species igual: +40
   - city igual (case-insensitive, trim): +30
   - color: normalizar (remover acentos, lowercase), usar Levenshtein distance — similaridade > 60%: +15
   - breed: mesma lógica fuzzy: +10
   - distância < 5km via Haversine (se ambos têm lat/long): +5
5. Normalizar: `confidence = score / 100` — nunca maior que 1.0
6. Descartar `confidence < 0.55` retornando 0
7. Exportar também `haversineDistanceKm(lat1, lon1, lat2, lon2): number`

### Harness Commands
```bash
npm run typecheck
npx vitest run matching-ia
```

### Critério de Aceite
- [ ] `calculateMatchScore` com mesma espécie, cidade, cor e raça retorna >= 0.95
- [ ] `calculateMatchScore` com espécies diferentes retorna 0
- [ ] Score < 0.55 retorna 0 (não inserível)
- [ ] Pelo menos 10 casos de teste unitários
- [ ] `npm run typecheck` sem erros

---

## T3 — API Route: trigger manual de matching `/api/matching/run`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/api/matching/run/route.ts` (novo)

### Especificação EARS
THE SYSTEM SHALL permitir execução manual do matching via API (para teste e CRON do n8n).

### O que fazer
1. `POST /api/matching/run` — aceita `Authorization: Bearer {MATCHING_RUN_SECRET}` (nova env var)
2. Buscar todos os pets `kind = 'lost', status = 'active', created_at > now() - 60 days`
3. Para cada pet perdido, buscar pets `kind = 'found', status = 'active'` na mesma `city`
4. Calcular score com `calculateMatchScore`
5. Se score > 0: tentar INSERT em `pet_matches` com `ON CONFLICT DO NOTHING`
6. Para cada match criado com `confidence_score >= 0.70`: disparar notificação de email (via Resend ou evento n8n)
7. Retornar `{ success: true, data: { pairs_evaluated, matches_created, duration_ms } }`
8. Log de execução em `notification_logs` com `channel = 'system'`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Request sem `Authorization` correto retorna 401
- [ ] `ON CONFLICT DO NOTHING` previne duplicatas na segunda execução
- [ ] Response inclui estatísticas de execução
- [ ] `npm run typecheck` sem erros

---

## T4 — Workflow n8n: CRON diário de matching

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `n8n/workflows/daily-matching-cron.json` (novo)

### O que fazer
1. Node **Schedule Trigger**: executa todo dia às 00:00 BRT (cron: `0 3 * * *` UTC)
2. Node **HTTP Request**: `POST {SITE_URL}/api/matching/run` com `Authorization: Bearer {MATCHING_RUN_SECRET}`
3. Node **IF**: verificar `$json.success === true`
4. Branch sucesso: Node **Slack/Email** (opcional) com resumo do CRON
5. Branch falha: Node **Email** para alertar Wes do erro
6. Exportar como JSON e salvar

### Harness Commands
```bash
npm run typecheck
```

### Critério de Aceite
- [ ] Workflow JSON exportado e salvo
- [ ] Schedule configurado para UTC (converter 00:00 BRT = 03:00 UTC)
- [ ] `MATCHING_RUN_SECRET` documentado em CLAUDE.md

---

## T5 — Páginas de confirmação e descarte de match

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:**
- `app/matches/[id]/confirmar/page.tsx` (novo)
- `app/matches/[id]/descartar/page.tsx` (novo)
- `app/api/matches/[id]/route.ts` (novo)

### Especificação EARS
WHEN o tutor acessa `/matches/[id]/confirmar`
THE SYSTEM SHALL atualizar `status = 'confirmed'` somente se o pet pertence ao usuário.

### O que fazer
1. API `PATCH /api/matches/[id]`: aceita `{ action: 'confirmed' | 'dismissed' }`; verificar que `lost_pet_id` do match pertence ao `auth.uid()`; atualizar status; retornar match atualizado
2. Página `/matches/[id]/confirmar`: Server Component — exibir dados do pet encontrado (foto, cidade, descrição); botão de confirmação; redirecionar para `/pets/[found_pet_id]` após confirmar
3. Página `/matches/[id]/descartar`: formulário com campo opcional de motivo; após descartar, redirecionar para `/meus-pets`
4. Se match não existe: 404; se já resolvido (pet `status = 'resolved'`): exibir mensagem "Pet já encontrado"

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] PATCH sem autenticação retorna 401
- [ ] PATCH de match cujo pet não pertence ao usuário retorna 403
- [ ] Após confirmar, pet não aparece mais em `/meus-pets` como perdido ativo
- [ ] `npm run typecheck` sem erros

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T5

**Dependências:**
- T2 é puramente lógica (sem DB) — pode ser feito em paralelo com T1
- T3 depende de T1 e T2
- T4 depende de T3 (chama a API route)
- T5 depende de T1 (tabela pet_matches)

## Harness Global

```bash
npm run typecheck
npx vitest run matching-ia
npm run build
```

