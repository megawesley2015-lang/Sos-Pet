# Joel Jota — Insights dos Vídeos (aplicados ao SOS Pet)
# Atualizado: 2026-06-16

---

## 1. "Crie uma empresa de IA autônoma em 16 minutos"
**Link:** https://www.youtube.com/watch?v=i6hjVDdsQdQ

### Conceito central
Criar uma empresa que opera sozinha com Claude Code + n8n + agentes autônomos.
Em 16 minutos Joel monta stack completo de agentes que trabalham sem intervenção humana.

### O que aplicar no SOS Pet
- Os 4 agentes planejados no CLAUDE.md SÃO esta empresa autônoma
- Stack: Supabase (banco) → webhook n8n → Claude (agente) → WhatsApp/Email
- **Prioridade:** Agente de Notificação (INSERT em pets → alertar voluntários da cidade)
- Dashboard `/admin/agentes` para monitorar execuções

### Status de implementação
- [ ] Agente Notificação (Semana 1 — mais crítico)
- [ ] Agente Moderação (Mês 2)
- [ ] Agente Matching (Mês 3)
- [ ] Agente Conteúdo (Mês 1 — pós-reencontro)

---

## 2. "Como Ficar RICO com IA | Segundo a Anthropic"
**Link:** https://www.youtube.com/watch?v=-VFTBwTxfJg

### Conceito central
Anthropic diz: as maiores oportunidades são "picks and shovels" — quem constrói a
infraestrutura que outros usam. Não só usar IA, mas vender acesso à IA como serviço.

### O que aplicar no SOS Pet
- SOS Pet É a infraestrutura (picks & shovels) para o mercado pet da Baixada Santista
- Os prestadores pagam para aparecer — nós somos o canal de distribuição
- **Monetização:** Plano Verificado R$49 + Plano Parceiro R$149 (já na /para-prestadores)
- Próximo: criar funil automático (lead → trial → paid) via n8n + email (Resend)

### Ações concretas
- [ ] Funil de conversão: prestador cadastra grátis → recebe email com oferta Verificado D+7
- [ ] Webhook no cadastro de prestador → n8n → sequência de onboarding por email

---

## 3. "Construa um Negócio de Uma Pessoa Só com IA (GUIA COMPLETO)"
**Link:** https://www.youtube.com/watch?v=yIaLSnkYzoQ

### Conceito central
One-person business: Wesley opera tudo sozinho, IA faz o trabalho de equipe inteira.
Tarefas delegadas à IA: moderação, suporte, conteúdo, analytics, notificação.

### O que aplicar no SOS Pet
| Função de equipe | Como IA assume |
|---|---|
| Suporte ao cliente | Agente Claude no WhatsApp/Telegram |
| Moderação de conteúdo | Agente moderação (foto + texto) |
| Marketing content | Claude Code skills (claude-marketing) |
| Analytics | Dashboard Supabase + métricas agentes |
| Notificação de usuários | Agente notificação n8n |
| SEO | Páginas dinâmicas /[type]-em-[city] |

### Ações concretas
- [x] Página /para-prestadores (marketing para B2B)
- [ ] Funil email automático (onboarding prestadores)
- [ ] Chatbot de suporte básico (FAQ via n8n)

---

## 4. "Meu time é de IA. Aprenda a criar o seu (Claude Code)"
**Link:** https://www.youtube.com/watch?v=qSjlUT93mpI

### Conceito central
Joel montou time de marketing inteiro dentro do Claude Code: pesquisa de mercado,
copywriting, criativos. Sem funcionário, sem agência.

### Skills de Claude Code para marketing do SOS Pet
- `claude-marketing` — copywriting, CRO, email sequences, análise de funil
- `claude-seo` — 13 sub-skills para SEO técnico, GEO, AEO
- `frontend-design` — sistema de design com tipografia bold, paleta com propósito

### Conteúdo para produzir com IA
- [ ] Email sequence: prestador cadastrado → D+1, D+7, D+30
- [ ] Copy para página /parcerias (B2B institucional)
- [ ] Posts Instagram: casos de reencontro (prova social)
- [ ] Blog posts SEO: "Como encontrar pet perdido em Santos"

---

## 5. "Minha visão prática sobre empresas AI First em 2026"
**Link:** https://www.youtube.com/watch?v=pMGg-5zFtqM

### Conceito central
AI-First NÃO é adicionar IA por cima do que existe. É redesenhar processos com IA
no centro. "Reconceber processos, produtos e decisões com sistemas inteligentes no meio."

### SOS Pet JÁ É AI-First (pontos fortes)
- ✓ Matching automático por IA (espécie + cor + porte + localização)
- ✓ Moderação automática (planejado)
- ✓ Notificação automática via agente (planejado)
- ✓ Onboarding pós-registro com redirect automático
- ✓ Claude Code como "time de engenharia"

### O que ainda falta para ser 100% AI-First
- [ ] Suporte ao cliente via agente (não formulário manual)
- [ ] Matching automático rodando em produção (apenas planejado)
- [ ] Relatórios de performance gerados automaticamente para prestadores
- [ ] Triagem automática de fotos de pets (qualidade, conteúdo)

---

## 6. "Entre 90 mil skills do Claude Code essas 10 são lendárias"
**Link:** https://www.youtube.com/watch?v=J3JyVL6Jld0

### As 10 skills lendárias (categorias)

**Geral (usar agora no SOS Pet):**
- `frontend-design` — 277k instalações, evita UI genérica (INSTALAR)
- `systematic-debugging` — protocolo 4 etapas: reproduzir → hipótese → testar → documentar
- `superpowers` — workflow completo: brainstorm, spec, impl, review, merge

**Automação:**
- `context-engineering` — estrutura memória de agentes, evita colisões (PARA n8n)
- `security-auditor` — audita prompt injection, privilege escalation

**Desenvolvimento:**
- `web-design-guidelines` — valida código vs padrões Vercel
- `agent-sandbox-skill` — executa código em sandbox cloud isolado

**Design:**
- `claude-seo` — 13 sub-skills SEO técnico + GEO + AEO (INSTALAR para /[type]-em-[city])
- `remotion-best-practices` — vídeo programático (para futura loja/conteúdo)
- `claude-marketing` — bundle copywriting + CRO + email (INSTALAR)

### Prioridade de instalação para SOS Pet
1. `frontend-design` — melhora UI geral
2. `claude-seo` — potencializa páginas SEO dinâmicas
3. `context-engineering` — melhora prompts dos agentes n8n
4. `claude-marketing` — copy para prestadores e campanhas

---

## Roadmap de implementação (ordem de impacto)

### Esta semana
1. [x] Página /para-prestadores (B2B marketing)
2. [ ] Onboarding-tutor (alta conversão — já no SESSION-STATE)
3. [ ] Avaliações de prestadores (monetização)

### Mês 1
4. [ ] Agente de Notificação n8n (INSERT pets → alertar voluntários)
5. [ ] Funil email prestadores (grátis → verificado)
6. [ ] Skills Claude Code: frontend-design + claude-seo

### Mês 2-3
7. [ ] Agente de Moderação automática
8. [ ] Agente de Matching automático
9. [ ] Dashboard analytics para prestadores (relatório mensal)
