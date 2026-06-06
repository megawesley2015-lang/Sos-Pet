# Decisions — Módulo ONG

Log imutável de decisões técnicas e de produto.

---

## DEC-ONG-01: Um shelter por usuário (não multi-admin)

**Data:** 2026-05-06
**Decisão:** Cada `auth.users` pode ter no máximo 1 shelter.
**Alternativa descartada:** N shelters por usuário (multi-admin, papéis por shelter).
**Razão:** Complexidade de RLS e UI desnecessária no MVP. ONGs pequenas
da Baixada Santista têm 1-2 gestores. Revisitar se surgir demanda real.
**Impacto:** RLS simplificada. Dashboard mostra dados de 1 shelter.

---

## DEC-ONG-02: Histórico de pet preservado após adoção

**Data:** 2026-05-06
**Decisão:** `shelter_pets.status = 'adopted'` — registro permanece no banco.
**Alternativa descartada:** Deletar o pet após adoção.
**Razão:** Prontuário, vacinas e medicações têm valor histórico e jurídico.
A ONG precisa consultar o histórico de um pet adotado para follow-up de saúde.
**Impacto:** Queries de pets ativos filtram `status IN ('available', 'fostered')`.

---

## DEC-ONG-03: is_shelter_owner como SECURITY DEFINER function

**Data:** 2026-05-06
**Decisão:** Usar funções SQL helper com SECURITY DEFINER para validar
propriedade em vez de JOINs inline em cada política RLS.
**Razão:** Queries de RLS com JOINs complexos são difíceis de auditar e
podem vazar dados se mal escritas. Funções encapsulam a lógica e são testáveis.
**Impacto:** RLS de medical_records/vaccinations/medications dependem de is_pet_owner().
Se is_pet_owner() tiver bug, afeta todas as tabelas filhas.

---

## DEC-ONG-04: Follow-up em 2 checkpoints fixos (30 e 90 dias)

**Data:** 2026-05-06
**Decisão:** Colunas fixas `follow_up_30_*` e `follow_up_90_*` em `adoptions`.
**Alternativa descartada:** Tabela separada `adoption_followups` com N registros.
**Razão:** Para o MVP, 2 checkpoints cobrem 95% dos casos. Tabela separada
adiciona complexidade de queries sem benefício real no curto prazo.
**Impacto:** Apenas 2 follow-ups por adoção. Pós-MVP: migrar para tabela separada se necessário.

---

## DEC-ONG-05: Webhook para n8n ao criar adoção

**Data:** 2026-05-31 (esta sessão)
**Decisão:** `createAdoption` dispara fetch para webhook n8n após sucesso.
**Alternativa descartada:** Trigger SQL no Postgres (Supabase Realtime).
**Razão:** Trigger SQL é mais difícil de debugar e não tem retry automático.
O webhook via Server Action é rastreável no log do n8n e tem retry configurável.
**Impacto:** Se o n8n estiver fora do ar, a adoção é criada mas a notificação falha silenciosamente.
Fix: implementar dead letter queue no n8n ou log de falha na tabela `webhook_logs`.
