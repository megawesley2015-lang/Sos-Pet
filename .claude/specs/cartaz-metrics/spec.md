# Spec — Métricas mínimas do funil de cartaz

- **Status:** proposta (aguardando aprovação)
- **Data:** 2026-07-06
- **Classificação (AI-First OS §8):** feature nova → só vira código após aprovação desta spec + plano.
- **Relacionado:** `.claude/specs/cartaz-qr/spec.md`, `docs/decisions/2026-07-05-rescue-poster-qr.md`.

---

## 1. Objetivo

Medir, com **o mínimo necessário e sem inventar dados**, se o cartaz de resgate está cumprindo o papel de
"rua → perfil digital → contato". Hoje o cartaz existe (`SOSAlertCard` + QR → `/pets/[id]`), mas **não há
nenhuma medição** de quantas pessoas geram, compartilham, escaneiam ou convertem em contato. Sem isso,
não dá para saber se o QR vale a pena nem onde o funil vaza.

**Não** é dashboard, não é growth, não é gráfico bonito — é o **conjunto mínimo de eventos** para enxergar o funil.

---

## 2. O funil real (mapeado no código)

```
1. Abrir /resgate?pet=X            (owner dispara SOS; RescueLauncher monta o cartaz)
2. Gerar PNG do cartaz             (html-to-image sobre SOSAlertCard)
3. Compartilhar / imprimir          (ação do owner fora do app)
4. Alguém escaneia o QR            → cai em /pets/[id]  (QR = getBaseUrl()/pets/[id])
5. Clica em contato                 (WhatsApp / Ligar no bloco de contato de /pets/[id])
```

Etapas 1–2 e 5 são observáveis **no app** (client). A etapa 4 (scan) só é observável como **visita a
`/pets/[id]` vinda do cartaz** — exige um marcador de origem na URL do QR (ver §4).

---

## 3. Métricas mínimas (o que medir)

| Evento | Onde dispara | Observável? |
|---|---|---|
| `cartaz_open` | `/resgate` abre com um pet (RescueLauncher montado) | ✅ client |
| `cartaz_generated` | PNG do cartaz gerado com sucesso | ✅ client |
| `cartaz_shared` | botão compartilhar/baixar acionado | ✅ client |
| `cartaz_scan_visit` | visita a `/pets/[id]?src=cartaz` (chegada via QR) | ✅ via marcador de origem |
| `pet_contact_click` | clique em WhatsApp/Ligar em `/pets/[id]` | ✅ client (pode segmentar por `src`) |

**Funil derivado:** open → generated → shared → scan_visit → contact_click. Só isso. Sem métricas vaidosas
(impressões, "alcance", etc.) que não podemos medir de verdade.

---

## 4. Abordagem (2 tiers — recomendação: Tier 0)

Já existe `lib/analytics/index.ts` com **`trackEvent(name, params)`** (GA4) + **consentimento LGPD**
(`hasAnalyticsConsent` / `setAnalyticsConsent`). Isso viabiliza medir **sem banco**.

### Tier 0 — GA4 + marcador de origem (recomendado, sem schema)
- Disparar os eventos da §3 via `trackEvent(...)` (respeitando o consentimento já implementado).
- **Atribuição do scan:** o QR passa a apontar para `/pets/${id}?src=cartaz` (hoje é `/pets/${id}` puro).
  Na chegada, `/pets/[id]` dispara `cartaz_scan_visit` quando `src=cartaz`. `pet_contact_click` inclui
  `src` como parâmetro para segmentar contato-via-cartaz.
- **Custo:** baixo, client-only, nenhuma tabela, nenhuma RLS. Dados ficam no GA (agregado, não-PII).
- **Trade-off:** depende de consentimento de analytics; sem consentimento, não mede (aceitável e honesto).

### Tier 1 — eventos first-party (só se Tier 0 for insuficiente; **requer aprovação de schema**)
- Uma tabela mínima `cartaz_events (id, pet_id, event, src, created_at)` — **sem PII**, sem IP bruto.
- Endpoint POST enxuto com rate-limit para registrar eventos server-side.
- **PARAR e perguntar:** isto é **mudança de schema + RLS + LGPD** → decisão separada, não entra sem OK
  explícito. Só considerar se o negócio precisar de dado próprio (ex.: relatório interno) além do GA.

**Recomendação:** começar por **Tier 0**. É reversível, honesto e não toca banco.

---

## 5. Privacidade / LGPD (obrigatório)

- **Sem PII:** nenhum evento carrega telefone, nome, e-mail ou IP bruto. Só `pet_id`, nome do evento, `src`.
- **Respeitar consentimento:** reusar `hasAnalyticsConsent()` — se negado/nulo, **não** disparar.
- O QR aponta para uma página **pública** (`/pets/[id]`); `?src=cartaz` não expõe nada sensível.
- Atualizar a política de privacidade **somente se** o Tier 1 (first-party) for aprovado; Tier 0 já está
  coberto pelo uso de GA existente (verificar o texto atual em `app/(marketing)/privacidade`).

---

## 6. Escopo

**Dentro (Tier 0):**
- `trackEvent` nos pontos: RescueLauncher (open/generated/shared) e `/pets/[id]` (scan_visit/contact_click).
- Adicionar `?src=cartaz` à URL do QR (mudança pequena em `app/resgate/page.tsx` onde `appUrl` é montado;
  `SOSAlertCard` não muda — recebe a URL pronta).

**Fora (sem aprovação separada):**
- Qualquer tabela/endpoint (Tier 1), schema, RLS.
- Dashboard/relatório visual.
- Métricas que não conseguimos medir honestamente.
- Tocar na plaquinha (outro funil) — esta spec é só do **cartaz de resgate**.

---

## 7. Critérios de aceite (Tier 0)

- [ ] `cartaz_open`, `cartaz_generated`, `cartaz_shared` disparam nos momentos certos do RescueLauncher.
- [ ] QR do cartaz passa a conter `?src=cartaz`; `/pets/[id]` dispara `cartaz_scan_visit` só quando `src=cartaz`.
- [ ] `pet_contact_click` dispara nos botões WhatsApp/Ligar, com `src` no payload.
- [ ] Nenhum evento dispara sem consentimento de analytics; nenhum evento carrega PII.
- [ ] Nenhuma mudança de schema, RLS, auth ou na lógica de contato.
- [ ] QR continua abrindo o `/pets/[id]` correto (o `?src=cartaz` não quebra a rota nem o `[id]`).
- [ ] `typecheck` + `build` verdes; testes existentes verdes.

## 8. Plano de verificação
1. `npm.cmd run typecheck` · `npm.cmd run build` · Vitest.
2. **Verificação manual real:** abrir `/resgate` de um pet, gerar o cartaz, e no GA4 DebugView confirmar os
   eventos `cartaz_open/generated/shared`. Escanear o PNG → conferir `cartaz_scan_visit` com `src=cartaz`.
   Clicar em WhatsApp → conferir `pet_contact_click`.
3. Testar **sem consentimento** → confirmar que nada dispara.
4. Confirmar que o QR ainda resolve para `/pets/[id]` certo.

---

## 9. Decisões pendentes (aprovar junto)
1. **Tier 0 só** (GA4, recomendado) ou também abrir Tier 1 (first-party, exige schema/RLS/LGPD — decisão à parte)?
2. **`?src=cartaz` no QR:** ok alterar a URL do QR do cartaz? (mudança pequena, mas mexe no artefato já
   commitado do QR). Alternativa: `utm_source=cartaz` se preferir padrão UTM para o GA.
3. **Nomes dos eventos:** manter o padrão `cartaz_*` / `pet_contact_click`, ou seguir convenção GA4
   (`select_content`, etc.)? Recomendo nomes próprios legíveis.

Não implementar sem `/plan` aprovado.
