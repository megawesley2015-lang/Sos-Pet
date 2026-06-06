# Design — Módulo ONG

**Status:** Código implementado | Aguardando migration

---

## Arquitetura de dados

```
auth.users
    │
    └─► shelters (1 shelter por user_id)
            │
            └─► shelter_pets (N pets por shelter)
                    │
                    ├─► medical_records  (prontuário)
                    ├─► vaccinations     (vacinas)
                    ├─► medications      (medicações)
                    └─► adoptions        (adoções — inclui shelter_id e pet_id)
```

### Decisão: 1 shelter por usuário

Um usuário autenticado pode ter no máximo 1 shelter.
Simplifica a lógica de RLS (sem selects de múltiplos shelters) e
elimina ambiguidade no dashboard. ONGs com múltiplos gestores
usarão o mesmo login no MVP — multi-admin é pós-MVP.

### Decisão: adoção mantém histórico do pet

Quando um pet é adotado, `shelter_pets.status` muda para `adopted`
mas o registro **permanece no banco**. O histórico completo
(prontuário, vacinas, medicações) fica acessível para consulta futura.

---

## Fluxo de autenticação e proteção de rota

```
request /ong/*
    │
    ▼
middleware.ts
    │ (sessão inválida?)
    └─► redirect /login?next=/ong/dashboard
    │
    ▼
Server Component
    │
    ├─► getUserSafe(supabase)   → valida token
    │
    ├─► busca shelters WHERE user_id = auth.uid()
    │       │
    │       └─ sem shelter? → redirect /ong/cadastro
    │
    └─► renderiza página com dados do shelter
```

### Por que getUserSafe e não getSession?

`getUserSafe` usa `supabase.auth.getUser()` que valida o JWT no servidor
(não confia no token do cookie cegamente). Mais seguro que `getSession()`
que pode aceitar tokens expirados em cache.

---

## RLS — estratégia para o módulo ONG

Todas as tabelas do módulo usam RLS baseada em funções helper
para evitar queries aninhadas repetidas:

```sql
-- is_shelter_owner: O usuário logado é dono deste shelter?
is_shelter_owner(shelter_id UUID) → BOOLEAN

-- is_pet_owner: O usuário logado é dono do shelter deste pet?
is_pet_owner(pet_id UUID) → BOOLEAN
```

Ambas são `SECURITY DEFINER` — executam com permissões elevadas
mas sem expor dados além do necessário.

**Nenhuma tabela do módulo tem SELECT público.**
Diferente de `pets` (achados e perdidos) que é público,
os dados de uma ONG são privados — apenas o dono vê.

---

## Estrutura de rotas

```
/ong                          → listagem pública de ONGs (futura)
/ong/cadastro                 → upsert de shelter (auth obrigatório)
/ong/dashboard                → métricas do shelter logado
/ong/pets                     → lista pets do shelter
/ong/pets/novo                → cadastro de pet
/ong/pets/[id]                → perfil do pet
/ong/pets/[id]/editar         → edição do pet
/ong/pets/[id]/prontuario     → registros médicos
/ong/pets/[id]/vacinas        → vacinas
/ong/pets/[id]/medicacoes     → medicações
/ong/adocoes                  → lista adoções
/ong/adocoes/novo             → registrar nova adoção
/ong/adocoes/[id]             → detalhe + follow-up
/ong/prontuarios              → prontuário geral (todos os pets)
```

---

## Server Actions — contratos

### upsertShelter (cadastro/actions.ts)
- Input: FormData com campos do ShelterSchema (Zod)
- Valida com Zod antes de qualquer query
- Faz SELECT primeiro: se existe → UPDATE, senão → INSERT
- Revalida `/ong/cadastro` e `/ong/dashboard`

### createAdoption (adocoes/actions.ts)
- Input: FormData com AdoptionSchema
- Verifica ownership do pet (shelter_id bate com user)
- Transação paralela: INSERT adoptions + UPDATE shelter_pets.status='adopted'
- Redireciona para `/ong/adocoes` após sucesso

### updateFollowUp (adocoes/actions.ts)
- Input: adoptionId + FormData com datas/notas de follow-up
- Verifica ownership via shelter_id
- Atualiza campos de follow-up sem mudar outros dados

---

## Performance

- Dashboard usa `Promise.all` com 8 queries paralelas (não sequenciais)
- `export const revalidate = 60` no dashboard — cache de 60s no servidor
- Índices no banco: `shelter_id`, `status`, `health_status`, `rescue_date DESC`
- Vacinas: índice em `(pet_id, applied_date DESC)` para query de vencimento
