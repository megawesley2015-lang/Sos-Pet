# QR Code no cartaz de resgate (SOSAlertCard)

- **Data:** 2026-07-05
- **Status:** aprovada

## Contexto
O fluxo "rua → perfil digital do pet" tinha duas vias: a **plaquinha** (etiqueta QR) já apontava
para `/pets/[id]` corretamente, mas o **cartaz de resgate** (pôster PNG "PROCURA-SE" gerado por
`html-to-image` em `components/rescue/SOSAlertCard.tsx`) mostrava o link apenas como **texto**
(`"Detalhes: {appUrl}"`) — ninguém digita uma URL da rua. O dado (`appUrl = /pets/[id]`) já fluía
via `RescueLauncher` desde `/resgate`, faltava torná-lo escaneável. Diagnóstico e spec em
`.claude/specs/cartaz-qr/spec.md`.

## Decisão
Adicionar um **QR Code real** ao `SOSAlertCard`, escaneável, apontando para `appUrl` (`/pets/[id]`),
usando `QRCodeSVG` de `qrcode.react` (já no projeto). QR em **wrapper branco com quiet zone**,
preto-e-branco por legibilidade, posicionado à **direita** do bloco de contato (layout horizontal
para não crescer a altura fixa 540×810). O link textual foi mantido como **fallback reduzido e
secundário**. Escopo: **apenas** `SOSAlertCard.tsx` — sem tocar rota, schema, RescueLauncher,
plaquinha, admin ou `/pets/[id]`. Sem rota `/cartaz`.

## Motivo
- Completa o fluxo rua → perfil sem depender de digitação.
- Reaproveita infra existente (`qrcode.react`, `appUrl` já passado), sem feature/schema novo.
- QR à direita e preto-e-branco prioriza captura no PNG e legibilidade sobre estética, respeitando
  o limite de altura do card e a paleta intocada.

## Impacto
- **Código:** 1 arquivo (`components/rescue/SOSAlertCard.tsx`) — className/JSX; import de `QRCodeSVG`.
- **Comportamento:** com `appUrl`, o cartaz gerado passa a ter QR escaneável → `/pets/[id]`; sem
  `appUrl`, comportamento inalterado.
- **Gates:** typecheck ✅, build ✅ (70/70), vitest ✅ (294/294, `plaquinha-qr` intacto).
- **Não afeta:** rota, schema, RLS, auth, SEO, plaquinha, admin.
- **Validação residual (manual):** escanear o **PNG exportado** de `/resgate` num celular para
  confirmar que abre o `/pets/[id]` correto — único critério não coberto por typecheck/build.
- **Commits:** `feat: add QR code to rescue poster` (`1dfb676`).
