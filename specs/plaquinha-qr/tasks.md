# Tasks — Plaquinha QR Code de Identificação
# SDD Fase 3: DECOMPOR
# Status geral: ✅ Concluído — 2026-06-12
# Referências: spec.md

---

## T1 — Instalar dependências e criar componente `PlaquinhaPreview`

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivos:**
- `components/plaquinha/PlaquinhaPreview.tsx` (novo)
- `package.json` (verificar dependências)

### O que fazer
1. Verificar se `qrcode` ou `qrcode.react` estão instalados; se não, instalar `qrcode.react`
2. Criar componente Client Component `PlaquinhaPreview`:
   - Props: `{ petName: string, photoUrl?: string, petId: string, bgColor: 'orange' | 'teal' | 'black' }`
   - Renderizar div com dimensões fixas de 300×300px (representa 5cm×5cm a 300dpi)
   - QR Code: `<QRCodeSVG value={`${SITE_URL}/pets/${petId}`} size={120} />`
   - Foto circular: `next/image` com fallback para placeholder SVG de pata
   - Nome truncado a 20 chars com `...` se exceder
   - Cores de fundo: mapeadas para tokens do design system (laranja = `--color-primary`, teal = `--color-accent`, preto = `#121214`)
3. Exportar `ref` via `forwardRef` para uso pelo `html-to-image`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Componente renderiza sem erros com props mínimas (`petName`, `petId`)
- [ ] Sem `photoUrl`, usa SVG placeholder (sem `<img>` com src vazio)
- [ ] Nome com 25 chars é truncado para 20 + "..."
- [ ] QR Code visível no preview
- [ ] `npm run typecheck` sem erros

---

## T2 — Hook `usePlaquinhaGenerator` para download PNG/PDF

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `hooks/usePlaquinhaGenerator.ts` (novo)

### Especificação EARS
WHEN usuário clica "Baixar PNG"
THE SYSTEM SHALL usar `html-to-image` para capturar o preview e forçar download.

### O que fazer
1. Aceitar `ref: RefObject<HTMLDivElement>` do componente de preview e `petName: string`
2. Função `downloadPNG()`:
   - Chamar `htmlToImage.toPng(ref.current, { pixelRatio: 3 })` (300dpi para print)
   - Criar link `<a>` com `download="plaquinha-{petName}.png"` e `href = dataUrl`
   - Chamar `link.click()`, remover link
   - Tratar erro de CORS: catch → setar `error = 'Erro ao gerar imagem — tente usar uma foto diferente'`
3. Função `downloadPDF()`:
   - Gerar PNG via `toPng`
   - Usar `jspdf` (verificar/instalar) para criar PDF tamanho 5cm×5cm
   - Adicionar imagem no PDF e chamar `pdf.save('plaquinha-{petName}.pdf')`
4. Retornar `{ downloadPNG, downloadPDF, isGenerating, error }`

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] `downloadPNG()` gera arquivo `.png` com nome correto
- [ ] `downloadPDF()` gera arquivo `.pdf`
- [ ] Erro de CORS não quebra a UI — seta `error` descritivo
- [ ] `isGenerating = true` durante a geração (botão fica desabilitado)
- [ ] `npm run typecheck` sem erros

---

## T3 — Página `/plaquinha` com seleção de pet e personalização

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/(public)/plaquinha/page.tsx`

### O que fazer
1. Verificar autenticação; se não logado, exibir CTA "Faça login para gerar sua plaquinha" + link `/login`
2. Buscar pets do usuário logado: `GET /api/pets?owner=me` (ou query Supabase direta)
3. Se usuário não tem pets: exibir CTA "Cadastre seu pet primeiro" + link `/achados-e-perdidos/novo`
4. Select de pet: dropdown com nome e thumbnail
5. Controles de personalização:
   - Input de nome do pet (pré-preenchido do pet selecionado; editável)
   - Swatches de cor de fundo (3 opções)
6. Renderizar `<PlaquinhaPreview ref={previewRef} ... />` com as opções selecionadas
7. Botões "Baixar PNG" e "Baixar PDF" usando `usePlaquinhaGenerator`
8. Botão "Encomendar impressão física" com preço (`NEXT_PUBLIC_TAG_PRICE_BRL`): adiciona ao carrinho e redireciona para `/loja/checkout`
9. Exibir `error` do hook com `<p className="text-red-500">` caso ocorra

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Sem autenticação, exibe CTA (não quebra)
- [ ] Dropdown lista pets do usuário
- [ ] Preview atualiza ao mudar pet ou cor
- [ ] "Baixar PNG" dispara download
- [ ] "Encomendar" redireciona para checkout com item no carrinho
- [ ] `npm run build` sem erros

---

## T4 — Atualizar `/pets/[id]` com banner "já encontrado" e botão contato

**Fase SDD:** Implementar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `app/(public)/pets/[id]/page.tsx`

### Especificação EARS
IF pet `status = 'resolved'`
THE SYSTEM SHALL exibir banner "Este pet já foi encontrado!" mas manter a página acessível.

### O que fazer
1. Verificar `pet.status === 'resolved'` e renderizar banner com estilo verde/sucesso no topo da página
2. Garantir que a página `/pets/[id]` exibe foto, nome, espécie, cor, cidade, descrição
3. Botão de contato: se `contact_whatsapp = true` e `contact_phone`, exibir botão "Contatar via WhatsApp"
   com link `https://wa.me/55{contact_phone}?text=Olá!+Vi+seu+pet+{name}+no+SOS+Pet`
4. Se `contact_whatsapp = false`: exibir apenas `contact_phone` como texto
5. Incrementar `view_count` do pet (via RPC ou UPDATE no carregamento — fire-and-forget)

### Harness Commands
```bash
npm run typecheck
npm run build
```

### Critério de Aceite
- [ ] Pet com `status = 'resolved'` exibe banner verde no topo
- [ ] Pet ativo exibe botão WhatsApp (se disponível)
- [ ] `contact_phone` nunca aparece em SELECT sem `kind = 'detail'` (só via rota direta)
- [ ] `npm run typecheck` sem erros

---

## T5 — Testes de geração de QR e personalização

**Fase SDD:** Verificar
**Status:** ✅ Concluído — 2026-06-12
**Arquivo:** `tests/plaquinha-qr/plaquinha-qr.test.ts` (novo)

### O que fazer
1. Testar truncamento de nome: 25 chars → 20 + "..."
2. Testar URL do QR Code: `${SITE_URL}/pets/${petId}` correto
3. Testar fallback de foto: sem `photoUrl`, não renderiza `<img>` com src vazio
4. Mock de `html-to-image` para testar `downloadPNG` sem DOM real
5. Testar tratamento de erro CORS no hook

### Harness Commands
```bash
npx vitest run plaquinha-qr
```

### Critério de Aceite
- [ ] Pelo menos 6 casos de teste
- [ ] Todos os testes passam

---

## Ordem de Execução

T1 → T2 → T3 → T4 → T5

**Dependências:**
- T2 depende de T1 (usa o componente via ref)
- T3 depende de T1 e T2
- T4 é independente (página existente)
- T5 depende de T1 e T2

## Harness Global

```bash
npm run typecheck
npx vitest run plaquinha-qr
npm run build
```

