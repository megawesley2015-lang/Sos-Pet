# BUG-HUNT — Pet Aumigo
**Agente**: implementer | **Metodologia**: OpenSpec Spec-anchored
**Total**: 2 CRÍTICO · 5 ALTO · 6 MÉDIO · 3 BAIXO = 16 bugs

---

## CRÍTICOS (2)

### BUG-001: `select('*')` em admin/pets — expõe `contact_phone`/`contact_whatsapp`
**Arquivo**: `app/admin/pets/page.tsx:24`
**Severidade**: CRÍTICO
**EARS**: SE um usuário admin acessa a listagem `/admin/pets` ENTÃO O SISTEMA DEVE retornar apenas colunas explícitas sem `contact_*`, expondo contatos apenas no detalhe do pet.
**Problema**: A query `.select("*")` retorna todas as colunas incluindo `contact_phone` e `contact_whatsapp`, violando a regra absoluta de select explícito e expondo dados de contato em listagem.
**Correção**: `select("id, kind, status, name, species, breed, photo_url, neighborhood, city, created_at")`

---

### BUG-002: `select('*')` em admin/prestadores — expõe schema completo
**Arquivo**: `app/admin/prestadores/page.tsx:22`
**Severidade**: CRÍTICO
**EARS**: SE um usuário admin acessa `/admin/prestadores` ENTÃO O SISTEMA DEVE usar select explícito sem expor colunas sensíveis desnecessárias.
**Correção**: `select("id, nome, status, categoria, cidade, estado, descricao, slug, created_at")`

---

## ALTOS (5)

### BUG-003: Formato de resposta inconsistente nas rotas ONG
**Arquivo**: `app/api/ong/adoption/[id]/route.ts:13,21,37,39` | `app/api/ong/available-pets/route.ts:14,25`
**Severidade**: ALTO
**EARS**: SE uma rota de API retorna erro ENTÃO O SISTEMA DEVE retornar `{ success: false, error: '...' }`. SE retorna sucesso ENTÃO O SISTEMA DEVE retornar `{ success: true, data: {...} }`.
**Problema**: Retornam `{ error: "..." }` e `{ adoption }` / `{ pets }` sem os campos `success` obrigatórios.
**Correção**: Usar os helpers `ok()` e `fail()` de `@/lib/api-response`.

---

### BUG-004: `select('*')` em 7 arquivos de páginas/componentes
**Severidade**: ALTO
**Arquivos**:
- `app/pets/page.tsx:61` — `select("*", { count: "exact" })` em view `pets_public`
- `app/admin/sentinela/page.tsx:39`
- `app/admin/parceiros/page.tsx:21`
- `app/admin/loja/page.tsx:24`
- `app/loja/page.tsx:37`
- `app/loja/[id]/page.tsx:32`
- `app/dashboard-prestador/page.tsx:28`
**Correção**: Listar colunas explícitas em cada select.

---

### BUG-005: Race condition no webhook de adoção — `adoptionId` pode ser null
**Arquivo**: `app/ong/adocoes/actions.ts:63-88`
**Severidade**: ALTO
**EARS**: SE uma adoção é criada ENTÃO O SISTEMA DEVE capturar o `id` retornado pelo próprio INSERT para disparar o webhook, nunca fazendo query secundária que pode retornar registro errado.
**Problema**: Após o INSERT, faz query separada por `pet_id + shelter_id` para buscar o ID — pode retornar outro registro em concorrência. Webhook disparado com `adoption_id: null` se falhar.
**Correção**:
```ts
// Correto: retornar id direto do INSERT
const { data } = await supabase.from("adoptions").insert({...}).select("id").single()
fetch(webhookUrl, { body: JSON.stringify({ adoption_id: data.id }) })
```

---

### BUG-006: Lógica de overdue inline duplicada em `adocoes/page.tsx`
**Arquivo**: `app/ong/adocoes/page.tsx:128-132`
**Severidade**: ALTO
**EARS**: SE a regra de negócio de overdue de acompanhamento muda ENTÃO O SISTEMA DEVE ter um único ponto de verdade via `isFollowUp30Overdue()` / `isFollowUp90Overdue()`.
**Problema**: Usa lógica inline em vez da função centralizada de `@/lib/validation/ong`. Inconsistência garantida quando a regra mudar.
**Correção**: Importar e usar `isFollowUp30Overdue` / `isFollowUp90Overdue`.

---

### BUG-007: Encoding incorreto — acentos ausentes em mensagens de erro
**Arquivo**: `app/ong/pets/[id]/medicacoes/actions.ts:31-32` | `app/ong/pets/[id]/vacinas/actions.ts:27-28`
**Severidade**: ALTO
**EARS**: SE o sistema retorna mensagem de erro em PT-BR ENTÃO O SISTEMA DEVE usar acentuação UTF-8 direta, nunca omitir acentos.
**Problema**: `"Nao autenticado."` e `"Sem permissao."` sem acentos. O `prontuario/actions.ts` do mesmo módulo usa `"Não autenticado."` corretamente.
**Correção**: Corrigir para `"Não autenticado."` e `"Sem permissão."`.

---

## MÉDIOS (6)

### BUG-008: `select("*")` em `pets_public` na página pública de pets
**Arquivo**: `app/pets/page.tsx:61`
**Severidade**: MÉDIO — view já filtra colunas, mas viola o padrão do projeto.

---

### BUG-009: `select("*")` em `pets_public` no perfil de usuário
**Arquivo**: `app/perfil/[id]/page.tsx:51`
**Severidade**: MÉDIO

---

### BUG-010: Formato de resposta incorreto em `/api/pets/lost-active`
**Arquivo**: `app/api/pets/lost-active/route.ts:21-25`
**Severidade**: MÉDIO — erro retorna `{ error: msg }` sem `success: false`; sucesso retorna `{ pets: [] }` sem `success: true` e sem wrapper `data`.

---

### BUG-011: Formato de resposta incorreto em `/api/sync/printful`
**Arquivo**: `app/api/sync/printful/route.ts:21-52`
**Severidade**: MÉDIO — usa `{ error: "..." }` e `{ ok: true }` em vez de `{ success: false/true }`.

---

### BUG-012: Cast `any` sem justificativa
**Arquivo**: `app/pets/[id]/page.tsx:110`
**Severidade**: MÉDIO — `(s: any)` sem justificativa. Usar tipo `SightingRow` já disponível.

---

### BUG-013: Lógica de overdue INVERTIDA no dashboard ONG
**Arquivo**: `app/ong/dashboard/page.tsx:344-345`
**Severidade**: MÉDIO (impacto visual alto — KPIs errados)
**EARS**: SE o dashboard exibe contagem de acompanhamentos atrasados ENTÃO O SISTEMA DEVE usar `isFollowUp30Overdue()` / `isFollowUp90Overdue()` da lib centralizada, não lógica inline.
**Problema**: Dashboard calcula overdue como `follow_up_30_date <= today` (atrasado quando data EXISTE e passou). A lógica correta é "atrasado quando data é NULL e o prazo passou". As lógicas são **opostas** — dashboard mostra falso positivo para adoções com acompanhamento feito.
**Correção**: Substituir por `isFollowUp30Overdue` / `isFollowUp90Overdue` de `@/lib/validation/ong`.

---

## BAIXOS (3)

### BUG-014: Formato `{ ok: true }` em rota dev
**Arquivo**: `app/api/dev/seed-ong/route.ts`
**Severidade**: BAIXO (dev-only) — usar `{ success: true }`.

---

### BUG-015: `select("*, pets(...)")` com `*` em avistamentos admin
**Arquivo**: `app/admin/avistamentos/page.tsx:22`
**Severidade**: BAIXO

---

### BUG-016: `select("*, shelters!inner(...)")` com `*` em shelter_pets
**Arquivo**: `app/ong/pets/[id]/page.tsx:43` | `app/ong/pets/[id]/editar/page.tsx:20`
**Severidade**: BAIXO

---

## Padrões verificados como OK

- `await params` em todos os Route Handlers — correto para Next.js 15+
- `await cookies()` em `lib/supabase/server.ts` — correto
- `contato` não aparece em listagens públicas — `PetPublic` exclui `contact_*` por tipo
- `select("*", { count: "exact", head: true })` — count-only sem rows, aceitável
