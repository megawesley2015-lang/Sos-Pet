# SOS Pet Aumigo — Cérebro da Empresa

## Identidade

**Produto:** SOS Pet Aumigo  
**Missão:** Reunir pets perdidos com seus tutores na Baixada Santista, com velocidade e tecnologia.  
**Região:** Santos, Guarujá, São Vicente, Cubatão, Bertioga, Praia Grande, Mongaguá, Itanhaém, Peruíbe.  
**Modelo:** Gratuito para tutores + monetização B2B/Premium (prestadores, loja, plaquinhas).

## O que entregamos

1. **Localização de pets perdidos** — cadastro, busca, matching inteligente por espécie/cor/porte/cidade
2. **Rede de avistamentos** — mapa colaborativo de pets avistados na região
3. **Prestadores pet** — clínicas, pet shops, veterinários, banho e tosa
4. **Plaquinhas QR Code** — produto físico com QR para identificação do pet
5. **Módulo ONG** — gestão de adoções, prontuário veterinário, vacinas

## Público-alvo

| Persona | Dor principal | O que buscam |
|---|---|---|
| Tutor (perdeu pet) | Desespero, medo, urgência | Achar o pet rápido |
| Encontrador | Não sabe o que fazer com pet achado | Devolver para o dono |
| Protetor/Voluntário | Quer ajudar mas sem estrutura | Ferramenta para coordenar |
| Clínica/Pet Shop | Visibilidade local | Novos clientes na região |

## Diferenciais

- Único com foco na Baixada Santista (9 municípios)
- Matching automático por IA (espécie + cor + porte + localização)
- Integração n8n → WhatsApp/Telegram para alertas em tempo real
- AI-First OS: agentes autônomos operando moderação, triagem e notificação
- Loja integrada de plaquinhas com QR Code (Printful dropshipping)

## Stack técnica (para referência dos agentes)

- Next.js 16 + React 19 + Tailwind v4
- Supabase (PostgreSQL + Auth + Storage)
- Deploy: Vercel (branch main = produção)
- Domínio: aumigo.com.br

## Modelo de monetização

1. **Plaquinhas** — R$39,90/unidade via Loja (dropshipping Printful)
2. **Clube SOS** — assinatura premium (planejado)
3. **Prestadores Premium** — destaque no diretório (planejado)
4. **B2B com ONGs** — gestão de abrigo/adoção (em desenvolvimento)
