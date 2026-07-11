# Loop — Retrofit de Mockup

> **Playbook permanente.** Sempre que o pedido for *"deixar igual ao mockup"*, *"aplicar o visual do
> mockup"* ou *"retrofit visual"*, execute este loop **antes de editar qualquer arquivo**.
>
> Este documento é operacional. As regras de mérito visual vivem em
> [`../DESIGN-MERGE-RULES.md`](../DESIGN-MERGE-RULES.md) e o processo geral em
> [`../AI-FIRST-OPERATING-SYSTEM.md`](../AI-FIRST-OPERATING-SYSTEM.md). **Não duplicar** o conteúdo
> desses dois aqui — apenas apontar.

---

## 1. Nome do loop

**Loop 1 — Retrofit de Mockup** (Design Merge).

## 2. Quando usar

- Pedido para alinhar uma tela real ao mockup warm/creme (`mockups/*.html`).
- Migração de tema (dark legado → warm/light).
- Qualquer "deixar igual ao mockup" / "aplicar o visual do mockup".

**Não usar para:** feature nova, mudança de dado/schema, ajuste de lógica ou billing. Isso segue o
fluxo padrão do AI-First OS (spec → plano → aprovação), não este loop.

## 3. Trigger

O usuário pede para deixar uma tela igual ao mockup ou aplicar o visual do mockup.

## 4. Goal

Aplicar o visual do mockup **sem remover funcionalidade real**.
Regra-mãe: **mockup = design target · app real = functional source of truth · merge inteligente, não
substituição.**

## 5. Inputs obrigatórios

- **Bloco / área** (ex.: "Prestadores & Serviços").
- **Rota real** alvo (confirmada, não o nome do arquivo do mockup).
- **Mockup correspondente** em `mockups/`.
- **Arquivos permitidos** para o lote (escopo fechado). Se não vierem, o loop os *propõe* na Plan phase
  e aguarda aprovação.

## 6. Read phase

Ler, **sem editar**:

1. [`docs/DESIGN-MERGE-RULES.md`](../DESIGN-MERGE-RULES.md) — regras de merge e tokens warm.
2. [`docs/AI-FIRST-OPERATING-SYSTEM.md`](../AI-FIRST-OPERATING-SYSTEM.md) — fluxo, modos, gates.
3. O mockup alvo em `mockups/`.
4. A página/rota real correspondente.
5. Os componentes compartilhados usados por essa rota.
6. A camada de dados envolvida (service/query/tipos) — só para entender o que preservar.

## 7. Audit phase

Entregar, **por tela**, sem editar:

1. Rota real confirmada.
2. Arquivos reais envolvidos.
3. O que já está OK (igual ao mockup).
4. Diferenças cosméticas pequenas.
5. Funcionalidades reais a preservar (regra 5 do DESIGN-MERGE).
6. Conteúdo do mockup que é fake/decorativo ou depende de dado inexistente (regras 6 e 8).
7. Melhorias futuras que dependem de dado/schema/lógica.
8. Riscos.
9. Micro-lote recomendado (se houver).

Fechar com **buckets executivos**: 🟢 não mexer · 🟡 só cosmético · 🟠 retrofit médio (lote próprio) ·
🔴 não mexer agora (shell compartilhado / decisão humana / redesign disfarçado).

## 8. Plan phase

- Propor **mudanças mínimas** (idealmente só `className`/visual).
- Listar arquivos por passo, ordem e gates.
- Explicitar o que será **preservado**.
- Marcar o que fica de fora (melhoria futura / decisão separada).

## 9. Approval gate

**PARAR e aguardar aprovação humana explícita.** Nenhuma edição antes disso.
Se algo do lote tocar schema/auth/RLS/pagamento/rota/query/lógica → não faz parte deste loop:
parar e pedir decisão separada.

## 10. Implement phase

- Executar **somente** o escopo aprovado. Não expandir.
- Preferir alterações `className`/visual. Não copiar HTML estático por cima do app real.
- Não portar dado fake do mockup. Não remover funcionalidade, estado, rota ou query.
- Não tocar componente compartilhado com superfície dark sem variante/decisão.

## 11. Verify phase

- `npm.cmd run typecheck` — sem erros.
- `npm.cmd run build` — exit 0.
- **Grep de resíduos** nos arquivos tocados (quando visual):
  `bg-ink-`, `border-white/`, `text-cyan-300`, `text-brand-300`, `shadow-glow`, `glow-text`.
- Relatório final: arquivos alterados, o que foi preservado, gates, pendências. Confirmar
  className-only quando for o caso.

## 12. Stop conditions

Parar (e reportar / pedir decisão) quando:

- Aprovado e verificado (fim normal do lote).
- Bloqueado por dado/schema/tabela inexistente.
- Risco funcional encontrado (perda de dado, estado, rota, query, auth).
- Precisa de decisão humana (preço, nomenclatura, claim, redesign de layout).
- `typecheck`/`build` falhou e o fix não é trivial.

## 13. Memory rules

- Se descobrir uma **regra nova** de design ou negócio → registrar em `docs/decisions/` **ou** atualizar
  [`../DESIGN-MERGE-RULES.md`](../DESIGN-MERGE-RULES.md) **com aprovação**.
- Se for só aplicação normal do padrão existente → **não** criar decisão nova.
- Memória persistente só para o não-óbvio; não duplicar o que o repo já registra.

## 14. Prompt template reutilizável

```
Loop 1 — Retrofit de Mockup. Modo auditoria: não edite nada ainda.

Input:
- Bloco: <área>
- Rota real: <rota>
- Mockup: mockups/<arquivo>.html
- Arquivos permitidos: <lista, ou "propor">

Read: docs/DESIGN-MERGE-RULES.md, docs/AI-FIRST-OPERATING-SYSTEM.md, o mockup,
a rota real e os componentes compartilhados.

Audit (por tela): rota confirmada · arquivos · o que já está OK · diferenças cosméticas ·
funcionalidades reais a preservar · conteúdo fake do mockup · melhorias futuras (dep. de dado/schema) ·
riscos · micro-lote recomendado. Fechar com buckets 🟢🟡🟠🔴.

Regras: mockup = design target · app real = source of truth · merge, não substituição ·
className/visual only · não inventar dado · não remover funcionalidade · não tocar
schema/auth/RLS/queries/rotas/lógica/preço sem aprovação separada.

PARAR e aguardar aprovação antes de implementar.
Depois de aprovado: implementar só o escopo → npm.cmd run typecheck && npm.cmd run build →
grep de resíduos nos arquivos tocados → reportar arquivos, preservado, gates, pendências.
```

## 15. Exemplo aplicado — Bloco Prestadores & Serviços

Aplicação real deste loop (auditoria + execução em 2026-07-09), mapeando mockup → rota real:

| Mockup | Rota real | Resultado |
|---|---|---|
| `mockups/prestadores.html` | `/prestadores` | 🟢 Body e `PrestadorCard` já warm. Ajuste 🟡: banner B2B `cyan-*` → teal oficial (Lote A). |
| `mockups/prestador-perfil.html` | `/prestadores/[slug]` | 🟠 Body já warm; os componentes de contato/avaliação renderizados nele estavam dark → recoloridos (Lote B). Layout 2-col + seções "Serviços"/"Horários" seguem como melhoria futura (dep. de schema). |
| `mockups/dashboard-prestador.html` | `/dashboard-prestador` | 🟢 Componentes já warm; resíduo `glow-text-brand` + skeletons dark recoloridos (Lote A). Dados fake do mockup (deltas, "Pets ajudados", "Contatos recentes", "Perfil 75%") **não portados**. |
| `mockups/planos-prestadores.html` | `/para-prestadores` (**não existe `/planos`; não criar**) | 🟠/🔴 Seção Planos ainda dark (mockup é warm). Preços reais (R$49/R$149) ≠ fake do mockup (R$197/R$397) ✅. Achado funcional: R$49 (landing) vs R$59 (billing) → decisão humana, fora do retrofit. |

Execução em lotes className-only: **Lote A** (glow + banner + skeletons) e **Lote B** (componentes de contato/avaliação) commitados; **Lote C** (forms `novo`/`editar` + `PrestadorForm` + `ProviderPhotoUpload`) recolorido aguardando commit.

Lições que este exemplo reforça:
- **Confirmar a rota real primeiro** — `/para-prestadores` é a rota dos planos; `/planos` não existe.
- **Grep no escopo certo antes de assumir** — as superfícies principais já estavam warm, mas os
  componentes de apoio (contato, avaliações, skeletons, forms) ainda eram dark; só o grep abrangente revela.
- **Fatiar em lotes pequenos** — cosmético trivial, componentes e forms em lotes separados, cada um com gate e aprovação.
- **Separar cosmético de funcional** — preço/nomenclatura de plano são decisão de negócio, nunca
  entram num passe de `className`.

---

*docs/loops/retrofit-mockup.md — SOS Pet Aumigo. Playbook operacional de retrofit visual.*
*Regras de mérito em DESIGN-MERGE-RULES.md; processo em AI-FIRST-OPERATING-SYSTEM.md. Não duplicar.*
