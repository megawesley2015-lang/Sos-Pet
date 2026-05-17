# Skill: SOS Pet — Marketing & Identidade Visual

> Esta skill orienta a criação de dois tipos de output para o **SOS Pet**: (1) **Cartão de Visita Digital** e (2) **Conteúdo para Instagram** (posts, Reels, carrosséis, stories). Todo output deve seguir o design system aprovado: dark futurista como base, laranja (`brand-500`) como cor primária de ação/urgência, cyan como acento secundário.

> **Idioma obrigatório:** Todo output em **português do Brasil (PT-BR)**.

---

## Contexto do Produto

**SOS Pet** é uma plataforma da Baixada Santista (9 cidades) para achados e perdidos de animais. Qualquer pessoa pode registrar um pet perdido ou encontrado. A plataforma conecta tutores e encontrantes via WhatsApp/telefone.

**Público-alvo:**
- Tutores que perderam seus pets (urgência, emoção, desespero)
- Pessoas que encontraram um pet na rua (boa saúde, senso de dever)
- Profissionais pet (veterinários, pet shops, hotéis — seção prestadores)

**Identidade visual:**
- Paleta: dark (`#0D0D0D` base) + laranja brand (`#F97316`) + cyan (`#22D3EE`)
- Tom: urgente, humano, futurista — mas sempre empático
- Badge "perdido": pulse animado laranja. Badge "encontrado": cyan estático
- Tagline: *"Sua busca começa aqui"* ou *"Conectando pets e tutores na Baixada Santista"*

---

## MÓDULO 1 — Cartão de Visita Digital

### Fluxo de Trabalho

#### Passo 1: Coleta de dados

Pergunte ao usuário:

- ✅ **Uso do cartão:** Para o produto SOS Pet em geral, para um prestador parceiro, ou para o tutor/encontrante?
- ✅ **Formato de entrega:** HTML interativo (para salvar como imagem/compartilhar), prompt para Canva, ou especificação visual descritiva?
- ✅ **Informações de contato a exibir:** Site, WhatsApp, Instagram, email?
- ✅ **Cidade/região de destaque?** (ex: Santos, São Vicente, Guarujá — ou "Baixada Santista")

#### Passo 2: Geração do cartão

Gere o cartão **em HTML puro** (single file) pronto para abrir no browser e salvar como imagem. Use as especificações abaixo.

---

### Especificações do Cartão de Visita Digital (SOS Pet)

```
Dimensões: 1050 × 600px (proporção padrão cartão de visita digital / LinkedIn)
Fundo: dark (#0D0D0D) com grid sutil ou gradiente radial laranja/cyan
Tipografia:
  - Nome/marca: bold, 36–48px, cor branca ou laranja
  - Subtítulo: medium, 18px, cinza claro (#A1A1AA)
  - Contatos: 14–16px, cor cyan ou branco
Elementos obrigatórios:
  ├── Logo/ícone da pata (🐾 ou SVG) — laranja, canto superior esquerdo
  ├── Nome: SOS Pet
  ├── Tagline: "Sua busca começa aqui | Baixada Santista"
  ├── Divisor: linha gradiente laranja → cyan
  ├── Contatos: ícones + texto (site, WhatsApp, Instagram)
  └── Rodapé: "Pets perdidos e encontrados — sempre de graça"
Efeitos visuais:
  - Glow sutil laranja na borda esquerda (box-shadow inset)
  - Badge animado pulse laranja para "PERDIDO" (opcional na versão digital)
  - Partículas ou grid pattern no fundo (CSS puro)
```

---

### Template de Output do Cartão

Entregue no seguinte formato:

```
## Cartão de Visita Digital — SOS Pet

### Especificação Visual (para uso no Canva ou Figma)

**Fundo:** [cor/gradiente]
**Título:** [texto + fonte + tamanho + cor]
**Tagline:** [texto]
**Elementos gráficos:** [descrição]
**Contatos exibidos:** [lista]
**Paleta:** [hex codes]

---

### Código HTML (arquivo único, pronto para salvar como imagem)

[bloco de código HTML completo]

---

### Prompt para IA generativa (Canva Magic Design / Midjourney / DALL-E)

[prompt em inglês, descritivo, pronto para colar]
```

---

## MÓDULO 2 — Conteúdo para Instagram

> Objetivo: crescer seguidores, aumentar alcance orgânico e posicionar o SOS Pet como referência em bem-estar animal na Baixada Santista.

### Fluxo de Trabalho

#### Passo 1: Coleta de configuração

Pergunte ao usuário:

- ✅ **Quantidade de posts:** Quantos posts serão gerados nesta sessão?
- ✅ **Formato:** Feed estático, Carrossel, Reels (roteiro), Story ou Mix?
- ✅ **Objetivo de negócio:** Ganhar seguidores, divulgar funcionalidade, gerar cadastros de pets, ou branding?
- ✅ **Tema livre ou dirigido?** (ex: "quero posts sobre como encontrar pet perdido" vs. "pode sugerir")
- ✅ **Tem foto/imagem do pet para usar?** (Sim/Não — afeta instrução visual)

#### Passo 2: Planejamento (Kit Zero)

Antes de escrever qualquer copy, apresente o plano dos posts:

```
Post [N]
├── Formato: [Feed / Carrossel / Reels / Story]
├── Categoria de conteúdo: [veja tabela abaixo]
├── Ângulo: [Emocional / Educativo / Urgência / Social Proof / Engajamento]
├── Hook: [primeira frase ou pergunta de abertura]
└── CTA: [o que o seguidor deve fazer]
```

**Aguarde aprovação antes de escrever os posts completos.**

#### Passo 3: Geração dos posts

Após aprovação, entregue cada post no template fixo abaixo.

---

### Categorias de Conteúdo Instagram SOS Pet

Use pelo menos uma categoria diferente por lote. Nunca repita a mesma categoria em posts consecutivos.

| # | Categoria | Objetivo | Frequência sugerida |
|---|-----------|----------|---------------------|
| 1 | **Alerta de Pet Perdido** | Urgência, compartilhamento viral | 2–3x por semana |
| 2 | **Pet Encontrado / Resolvido** | Prova social, emoção positiva | 1–2x por semana |
| 3 | **Dica de Segurança Pet** | Valor educativo, salvar/compartilhar | 2x por semana |
| 4 | **Engajamento / Pergunta** | Comentários, alcance orgânico | 1x por semana |
| 5 | **Bastidores / Produto** | Construir confiança na plataforma | 1x por semana |
| 6 | **Estatística / Dado** | Autoridade, curiosidade | 1x por semana |
| 7 | **Humor / Pet Content** | Viralização, follows orgânicos | 1–2x por semana |
| 8 | **Parceiro / Prestador** | B2B, audiência profissional | 1x por semana |
| 9 | **Cobertura Regional** | Pertencimento, comunidade local | 1x por semana |
| 10 | **Conscientização Animal** | Causa, propósito, reputação | 1x por semana |

---

### Matriz de Ângulos Criativos

| Ângulo | Tom | Quando usar |
|--------|-----|-------------|
| **Emocional / Urgência** | Empático, direto | Alerta de pet perdido, reencuentro |
| **Educativo / Dica** | Informativo, amigável | Segurança, microchip, coleira ID |
| **Prova Social** | Celebrativo, humano | Pet encontrado, depoimento |
| **Engajamento** | Curioso, descontraído | Enquete, "qual pet você tem?", quiz |
| **Autoridade Regional** | Local, orgulhoso | Cobertura Baixada, cidades atendidas |
| **Humor Pet** | Leve, meme-friendly | Conteúdo de identificação com dono |

---

### Formatos e Regras por Placement

#### Feed Estático (arte + legenda)
- Arte: headline impactante que funcione sozinha sem legenda
- Legenda: até 150 palavras no primeiro parágrafo (texto cortado após "mais")
- Hashtags: bloco separado no final, 10–20 tags relevantes
- CTA obrigatória: comentar, salvar, compartilhar ou link na bio

#### Carrossel (3–7 cards)
- Card 1: hook visual forte — pergunta ou afirmação polêmica
- Cards 2–N-1: um conteúdo por card, sem sobrecarregar
- Último card: CTA exclusiva + arroba @sospetbaixadasantista

#### Reels (roteiro vertical 15–60s)
- Hook nos primeiros 2 segundos (falado + texto sobreposto)
- Estrutura: Gancho → Problema/Situação → Solução/Dica → CTA
- Indicar trilha sonora sugerida (trending ou emocional)
- CTA final falada + legenda curta

#### Stories
- Fundo dark ou foto do pet
- Texto curto: máximo 2 linhas visíveis
- Elemento interativo: enquete, caixa de perguntas, contagem regressiva
- Swipe up ou "link na bio" se aplicável

---

### Template de Output Fixo por Post

```
## Post [N] | Categoria: [nome] | Formato: [Feed/Carrossel/Reels/Story] | Ângulo: [nome]

**Objetivo:** [o que este post tenta alcançar]
**Persona-alvo:** [quem será impactado]

---

### ARTE GRÁFICA

**Headline principal (texto na arte):**
> [texto curto, impacto imediato — máximo 8 palavras]

**Subheadline ou apoio:**
> [texto complementar opcional]

**Instrução visual:**
- Fundo: [dark / foto pet / gradiente laranja-cyan]
- Elemento central: [ícone / foto / número em destaque]
- Badge: [PERDIDO (pulse laranja) / ENCONTRADO (cyan) / nenhum]
- Paleta dominante: [laranja / cyan / ambos]

---

### LEGENDA (copy completa)

[Texto completo da legenda, com hook, desenvolvimento e CTA]

✓ [Ponto de valor ou dado 1]
✓ [Ponto de valor ou dado 2]
✓ [Ponto de valor ou dado 3]

👉 [CTA final: comentar / salvar / compartilhar / acessar link na bio]

---

### HASHTAGS

[bloco de 10–20 hashtags relevantes, agrupadas por categoria: produto + regional + pet geral + nicho]

Exemplo base:
#SOSPet #PetPerdido #PetEncontrado #BaixadaSantista #Santos #SaoVicente #Guaruja #CachorroDesaparecido #GatoDesaparecido #AjudaAnimal #PetLovers #TutorDePet #BemEstarAnimal #AdotaNaoCompra

---

### NOTAS DE PRODUÇÃO (opcional)

- Melhor horário para publicar: [sugestão baseada no público-alvo]
- Trilha sugerida (Reels): [nome ou estilo]
- Versão Story: [instrução simplificada se aplicável]
```

---

### Banco de Hooks por Categoria (referência rápida)

**Alerta de Pet Perdido:**
- "🚨 PERDIDO em [cidade] — você o viu?"
- "Ele não voltou para casa. Ajude a compartilhar."
- "[Nome do pet] desapareceu no dia [data]. Sua família não para de procurar."

**Pet Encontrado / Resolvido:**
- "Ele voltou! 🧡 O poder de uma rede unida."
- "De perdido a encontrado em [X horas]. Veja como aconteceu."
- "Isso é o que acontece quando o vizinho compartilha. 👀"

**Dica de Segurança Pet:**
- "Você sabia que [X%] dos pets perdidos não têm identificação?"
- "3 coisas que todo tutor deve fazer ANTES de perder o pet."
- "Microchip, coleira com plaquinha e cadastro. Os 3 escudos do seu pet."

**Engajamento / Pergunta:**
- "Qual é o nome do seu pet? Comenta aqui 👇"
- "Já encontrou um animal perdido na rua? O que você fez?"
- "Enquete: você cadastraria seu pet numa plataforma gratuita? Sim / Não"

**Dado / Estatística:**
- "Todo ano, mais de [X] pets se perdem no Brasil. A maioria nunca volta para casa."
- "Na Baixada Santista, [X] pets foram reunidos com suas famílias via SOS Pet."
- "Pets com plaquinha de identificação têm [X]x mais chance de voltar para casa."

**Humor / Pet Content:**
- "POV: seu pet quando você abre o pacote de ração errado 😂"
- "Donos de gato entendem esse olhar. 👀"
- "Cachorro perdido vs. Cachorro que escolheu uma nova família 🐶"

---

## Compliance e Restrições Instagram

| Regra | Detalhamento |
|-------|--------------|
| Não inventar dados reais | Se usar estatística, marcar como "estimativa" ou citar fonte |
| Não usar fotos de pets sem autorização | Sempre indicar que foto deve ser do banco próprio ou do cadastro com permissão |
| Tom empático em alertas | Nunca soar frio ou burocrático em posts de pet perdido |
| LGPD em dados de contato | Nunca publicar telefone/CPF/endereço sem consentimento explícito do tutor |
| Não prometer resultado | Evite "garantimos que seu pet será encontrado" |

---

## Referências do Produto

Para contexto técnico completo do SOS Pet (funcionalidades, stack, design system):

📄 `skill-meta-andromeda.md` — base metodológica de copywriting e diversidade criativa  
🎨 Design system: dark + laranja `#F97316` + cyan `#22D3EE`  
🌐 Cobertura: 9 cidades da Baixada Santista  
📱 Plataforma: Next.js + Supabase + Vercel | PWA instalável  
