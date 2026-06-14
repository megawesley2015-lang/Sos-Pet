# Tasks — Módulo ONG

**Sprint:** Ativar o módulo ONG em produção
**Estimativa total:** ~3h

---

## 🔴 BLOQUEADOR — deve ser feito primeiro

### TASK-ONG-00: Aplicar migration no Supabase
**Esforço:** 10 min | **Responsável:** Wes (manual)

```
1. Abrir Supabase Dashboard → projeto Pet Aumigo (odrybnjjpdxqjofgewam)
2. SQL Editor → New query
3. Colar conteúdo de: supabase/migrations/001_ong_module.sql
4. Run
5. Verificar: tabelas shelters, shelter_pets, medical_records,
             vaccinations, medications, adoptions criadas
```

Sem esta task, nada do módulo funciona.

---

## Fase 1 — Verificação após migration (30 min)

### TASK-ONG-01: Smoke test end-to-end
**Depende:** TASK-ONG-00

- [ ] Criar conta de teste: `ong-teste@aumigo.com.br`
- [ ] Acessar `/ong/cadastro` → preencher e submeter
- [ ] Confirmar row em `shelters` no Supabase Dashboard
- [ ] Acessar `/ong/dashboard` → confirmar métricas em zero (shelter novo)
- [ ] Cadastrar 1 pet em `/ong/pets/novo`
- [ ] Adicionar 1 prontuário, 1 vacina, 1 medicação
- [ ] Registrar 1 adoção → confirmar status do pet mudou para `adopted`
- [ ] Confirmar que outro usuário NÃO vê os dados (testar RLS)

### TASK-ONG-02: Adicionar link de acesso no Header
**Depende:** TASK-ONG-01 | **Esforço:** 15 min

Adicionar link `/ong/dashboard` no menu de navegação
(visível apenas para usuários autenticados).
Verificar componente em `components/layout/` — qual Header está ativo.

---

## Fase 2 — Melhorias de UX (1h30)

### TASK-ONG-03: Loading states no dashboard
**Esforço:** 20 min

O dashboard faz 8 queries em paralelo. Adicionar `loading.tsx`
ao lado de `dashboard/page.tsx` com skeleton de métricas.

```tsx
// app/ong/dashboard/loading.tsx
export default function DashboardLoading() {
  return <div className="animate-pulse">...</div>
}
```

### TASK-ONG-04: Alerta visual de vacinas vencendo
**Esforço:** 30 min

Na listagem `/ong/pets/[id]/vacinas`, destacar vacinas com
`next_dose_date` dentro de 30 dias com badge laranja `⚠️ Vence em X dias`.

Lógica já está no dashboard (query de `vaccinesDue`) — reaproveitar.

### TASK-ONG-05: Follow-up vencido — alerta proativo
**Esforço:** 40 min

Na listagem `/ong/adocoes`, exibir badge `🔴 Follow-up atrasado`
para adoções onde:
- `follow_up_30_date` é NULL e `adoption_date` passou de 30 dias
- `follow_up_90_date` é NULL e `adoption_date` passou de 90 dias

---

## Fase 3 — Harness n8n (spec separada)

### TASK-ONG-06: Webhook de adoção para n8n
**Esforço:** 45 min | **Spec:** `.claude/specs/ong-module/n8n-harness.md`

Quando uma adoção é criada via `createAdoption`, disparar webhook
para o n8n com payload da adoção + dados do pet + contato da ONG.

O agente n8n gerencia os lembretes de follow-up automaticamente.

---

## Critério de conclusão da sprint

- [ ] TASK-ONG-00 concluída (migration aplicada)
- [ ] TASK-ONG-01 passando (smoke test verde)
- [ ] TASK-ONG-02 concluída (link no menu)
- [ ] npm run typecheck → zero erros
- [ ] npm run build → sucesso
