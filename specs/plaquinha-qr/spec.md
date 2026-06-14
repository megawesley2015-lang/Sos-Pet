# Spec — Plaquinha QR Code de Identificação
# SDD Fase 1: ESPECIFICAR (O QUÊ — sem tecnologia)
# Notação: EARS (Easy Approach to Requirements Syntax)
# Status: ⬜ Pendente
# Slug: plaquinha-qr
# Responsável: Wes
# Data: 2026-06-10

---

## Contexto de Negócio

A plaquinha de identificação é o produto físico central do Pet Aumigo: uma tag para coleira
com QR Code que, quando escaneada, leva a uma página com nome do pet, foto e contato
do tutor. Se o pet se perder, qualquer pessoa pode escanear e entrar em contato. A rota
`/plaquinha` já existe e a lib `html-to-image` está instalada. O fluxo deve gerar o design
digital, exportar como PDF para download imediato, e opcionalmente criar um pedido na
Printful para impressão física personalizada.

## Estado Atual

| Item | Status |
|---|---|
| Rota `/plaquinha` | Existe (sem implementação completa) |
| `html-to-image` instalado | Sim |
| `NEXT_PUBLIC_TAG_PRICE_BRL` configurado | Sim |
| Rota `/pets/[id]` (destino do QR) | Existe |
| Integração Printful | Parcialmente implementada (loja-printful) |

## Requisitos — Notação EARS

### 2.1 Geração do QR Code

WHEN o usuário autenticado acessa `/plaquinha` e seleciona um pet
THE SYSTEM SHALL gerar um QR Code apontando para `{NEXT_PUBLIC_SITE_URL}/pets/{pet_id}`.

WHEN o QR Code é gerado
THE SYSTEM SHALL renderizá-lo dentro do design da plaquinha com nome do pet, foto e
uma mensagem de contato (ex: "Me achei! Ligue para meu tutor").

THE SYSTEM SHALL usar a lib `qrcode` (ou equivalente) no client-side para gerar o QR.

IF o pet não tiver foto cadastrada
THE SYSTEM SHALL usar um placeholder de pata estilizado no lugar da foto.

### 2.2 Personalização da Plaquinha

WHEN o usuário acessa a página de geração
THE SYSTEM SHALL exibir preview em tempo real da plaquinha com:
- Nome do pet (max 20 chars — truncar com aviso)
- Foto do pet (circular, do `photo_url`)
- QR Code
- Cor de fundo selecionável (mínimo 3 opções: laranja, teal, preto)
- Tamanho: 5cm × 5cm (para impressão) — representado no preview

WHEN o usuário altera nome, cor ou foto
THE SYSTEM SHALL atualizar o preview em tempo real sem delay perceptível.

### 2.3 Download Digital (PDF/PNG)

WHEN o usuário clica em "Baixar PNG"
THE SYSTEM SHALL usar `html-to-image` para capturar o elemento de preview e
forçar download do arquivo `plaquinha-{nome-pet}.png`.

WHEN o usuário clica em "Baixar PDF"
THE SYSTEM SHALL gerar um PDF com dimensões de impressão (5cm × 5cm a 300dpi)
usando a imagem gerada pelo `html-to-image`.

IF o download falhar (erro de CORS na foto do pet)
THEN THE SYSTEM SHALL exibir mensagem "Erro ao gerar imagem — tente usar uma foto
diferente" e usar o placeholder.

### 2.4 Pedido de Impressão via Printful

WHEN o usuário clica em "Encomendar impressão física" (preço: `NEXT_PUBLIC_TAG_PRICE_BRL`)
THE SYSTEM SHALL redirecionar para `/loja/checkout` com o item de plaquinha personalizada
pré-preenchido no carrinho, incluindo as customizações (nome, cor, foto_url).

WHEN o pedido é processado via Printful
THE SYSTEM SHALL incluir o nome e as customizações como instruções de personalização
no payload do pedido.

### 2.5 Página Pública `/pets/[id]` — destino do QR

WHEN alguém escaneia o QR Code e acessa `/pets/[id]`
THE SYSTEM SHALL exibir: foto do pet, nome, cor/raça, cidade, e botão de contato
(WhatsApp se disponível, ou formulário simples de mensagem).

IF o pet tiver `status = 'resolved'`
THEN THE SYSTEM SHALL exibir banner "Este pet já foi encontrado! 🎉" mas manter a página acessível.

---

## Critérios de Aceitação

- [ ] QR Code gerado aponta para URL correta de `/pets/[id]`
- [ ] Preview atualiza em tempo real ao mudar nome ou cor
- [ ] Pet sem foto usa placeholder (sem erro na geração do QR)
- [ ] Download PNG funciona com nome de arquivo correto
- [ ] Download PDF tem dimensões corretas para impressão
- [ ] Erro de CORS na foto exibe mensagem amigável (não quebra a página)
- [ ] "Encomendar impressão" pré-preenche o carrinho da loja
- [ ] `/pets/[id]` exibe banner "já encontrado" para pets com `status = 'resolved'`
- [ ] `npm run typecheck` sem erros
