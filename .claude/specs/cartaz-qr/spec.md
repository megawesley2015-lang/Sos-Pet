# Spec — QR Code real no cartaz de resgate

- **Status:** proposta (aguardando aprovação)
- **Data:** 2026-07-04
- **Escopo:** 1 arquivo — `components/rescue/SOSAlertCard.tsx`
- **Origem:** diagnóstico do fluxo "QR → perfil digital do pet". O cartaz de resgate (pôster PNG)
  hoje mostra o link apenas como texto (`"Detalhes: {appUrl}"`), sem QR escaneável.

---

## 1. Objetivo

Fazer o **cartaz de resgate impresso/compartilhado** conectar de fato a rua ao perfil digital do pet:
renderizar um **QR Code escaneável** no `SOSAlertCard`, apontando para `appUrl` (que já chega como
`/pets/[id]`). Assim, quem vê o pôster (impresso ou em story) aponta a câmera e cai no perfil do pet —
em vez de depender de digitar uma URL.

**Não** é feature nova de produto: é completar um artefato existente cujo dado (`appUrl`) já flui.

---

## 2. Comportamento esperado

- Quando `appUrl` **existir** (caso real: `/resgate` passa `${getBaseUrl()}/pets/${pet.id}`):
  - Renderizar `<QRCodeSVG value={appUrl} .../>` dentro do card.
  - QR dentro de um **wrapper branco** com padding (quiet zone) para garantir leitura sobre o fundo
    escuro do card (mesmo padrão já usado na plaquinha).
  - Manter (ou reorganizar minimamente) a informação de link/URL — o QR complementa, não precisa apagar
    o contexto textual, mas o texto cru `"Detalhes: {appUrl}"` pode ser reduzido/removido se o QR
    tornar redundante (decisão de layout, sem perder a marca `sospet.app`).
- Quando `appUrl` **não existir**: comportamento atual inalterado (sem QR, sem quebra).
- Sem QR "solto": sempre com quiet zone branca; contraste alto (módulos escuros sobre branco).

---

## 3. Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `components/rescue/SOSAlertCard.tsx` | Importar `QRCodeSVG` de `qrcode.react`; renderizar QR condicional a `appUrl`, em wrapper branco com padding; ajuste mínimo de layout na seção de contato/rodapé. |

**Fora de escopo (não tocar):** `RescueLauncher.tsx`, `app/resgate/page.tsx`, plaquinha
(`PlaquinhaPreview.tsx`, `admin/plaquinhas/*`), rota `/pets/[id]`, schema, dados, RLS, auth.
**Não** criar rota `/cartaz`. **Não** mudar a assinatura de props do `SOSAlertCard` (usa `appUrl` já existente).

---

## 4. Riscos visuais / html-to-image

O card é o alvo de `html-to-image.toPng()` (540×810 DOM → 1080×1620 px). Pontos de atenção:

1. **Captura do SVG:** `QRCodeSVG` renderiza **SVG inline** — geralmente capturado bem por html-to-image
   (não depende de CSS externo nem fontes). Risco baixo, mas **precisa ser verificado no PNG gerado**,
   não só no DOM.
2. **Quiet zone / contraste:** sem margem branca ao redor, leitores de QR podem falhar. Mitigação:
   wrapper `background:#fff` com `padding` (ex.: 8–10px) e `borderRadius`, igual à plaquinha.
3. **Espaço no layout:** o card já é denso (foto + título + tags + localização + contato). O QR precisa
   caber **sem empurrar/cortar** a seção de contato (que é `flexShrink: 0`). Provável posição: canto do
   bloco de contato ou rodapé, em tamanho contido (ex.: 88–110px). Verificar que nada estoura 810px de altura.
4. **CORS de imagem:** já é risco pré-existente da foto (`crossOrigin="anonymous"`); o QR (SVG local) não
   adiciona risco de CORS.
5. **Cor do QR:** manter módulos escuros (`#121214`/preto) sobre branco — não usar laranja/teal no QR
   (reduz taxa de leitura). Paleta do card intocada; QR é preto-e-branco por leitura, não por estética.

---

## 5. Critérios de aceite

- [ ] Com `appUrl` presente, o card renderiza um QR Code visível, em wrapper branco com quiet zone.
- [ ] O QR codifica exatamente `appUrl` (rota `/pets/[id]`), sem alterar a URL.
- [ ] Sem `appUrl`, o card se comporta como hoje (nenhum QR, nenhum erro).
- [ ] O PNG exportado (via html-to-image) **contém o QR legível** — validado escaneando o PNG real, não só o DOM.
- [ ] Layout preservado: foto, título, tags, localização e contato continuam visíveis e não cortados dentro de 540×810.
- [ ] Marca `sospet.app` / identidade do card mantida; paleta intocada.
- [ ] Nenhuma mudança fora de `SOSAlertCard.tsx`.

---

## 6. Plano de verificação

1. `npm.cmd run typecheck` — sem erros.
2. `npm.cmd run build` — exit 0.
3. `npm.cmd run test` — suíte existente continua verde (incluindo `__tests__/plaquinha-qr/`, que não deve
   ser afetada). Opcional: adicionar teste unitário simples afirmando que o valor do QR = `appUrl`.
4. **Verificação visual do artefato real:** abrir `/resgate` de um pet, gerar o PNG do cartaz e:
   - conferir que o QR aparece no PNG (não só no preview DOM);
   - **escanear o QR do PNG** com um celular e confirmar que abre `/pets/[id]` do pet certo;
   - conferir contraste/quiet zone e que nenhuma seção foi cortada.
5. Grep de sanidade: confirmar que só `SOSAlertCard.tsx` mudou.

---

## Decisão pendente

Ao aprovar, definir 2 detalhes de layout (posso propor default e você confirma na implementação):
- **Posição** do QR (sugestão: dentro/ao lado do bloco de contato laranja, canto inferior).
- **Destino do texto** `"Detalhes: {appUrl}"` (manter reduzido como fallback, ou remover já que o QR cobre).

Aguardando aprovação desta spec para gerar o plano e implementar.
