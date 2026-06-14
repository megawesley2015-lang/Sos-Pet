# Constituição Técnica — Pet Aumigo
# Spec-Driven Development | Nível: Spec-anchored
# Última revisão: 2026-06-08
# ─────────────────────────────────────────────────────────────────────────
# LEI MÁXIMA: Nenhum agente de IA pode violar estas restrições.
# Qualquer código gerado que contrarie este documento deve ser rejeitado.
# ─────────────────────────────────────────────────────────────────────────

## 1. Identidade do Projeto

- **Nome:** Pet Aumigo
- **Domínio:** Plataforma SaaS para pets perdidos + serviços pet — Baixada Santista
- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Supabase (PostgreSQL) · Vercel
- **Automação:** n8n + Claude (Anthropic) · Agentes: Tools Agent, temperature 0.3
- **Budget de infra:** US$ 200/mês máximo

---

## 2. Restrições de Segurança (INVIOLÁVEIS)

O sistema deve habilitar Row Level Security (RLS) em toda tabela nova.
O sistema deve usar UUID gen_random_uuid() como PK em toda tabela — nunca SERIAL.
O sistema deve referenciar auth.users(id) ON DELETE CASCADE em toda FK de usuário.
O sistema não deve expor service_role key em variáveis NEXT_PUBLIC_* ou código cliente.
O sistema não deve expor o campo `contato` do tutor em listagens — apenas em /[id].
O sistema deve validar todos os inputs de API via Zod antes de persistir no banco.

SE uma operação de banco não tiver política RLS cobrindo-a
ENTÃO o sistema deve recusar a operação com erro 403.

SE uma request de API receber dados inválidos segundo o schema Zod
ENTÃO o sistema deve retornar { success: false, error: "mensagem" } com status 400.

---

## 3. Padrões de Comunicação (Contratos)

O sistema deve retornar sucesso no formato: `{ success: true, data: {...} }`
O sistema deve retornar erro no formato: `{ success: false, error: "mensagem legível" }`

QUANDO uma Server Action for bem-sucedida
O sistema deve fazer redirect ou retornar { ok: true, message: "..." }

QUANDO uma Server Action falhar por erro do usuário (validação)
O sistema deve retornar { ok: false, errors: { campo: "mensagem" } }

QUANDO uma Server Action falhar por erro interno (banco, rede)
O sistema deve logar no Sentry e retornar { ok: false, message: "Erro interno" }

---

## 4. Padrões de Código (TypeScript/Next.js)

O sistema deve usar `await cookies()` e `await params` — Next.js 16+ (sem síncronos).
O sistema deve importar módulos com alias @/ (nunca caminhos relativos longos).
O sistema deve usar encoding UTF-8 com acentos diretos — nunca entidades HTML.
O sistema deve usar `select()` com colunas explícitas — nunca `select('*')`.
O sistema deve usar createSupabaseServerClient() em Server Components.
O sistema deve usar createClient() (browser) em Client Components.

SE um componente precisar de dados do Supabase E for um Server Component
ENTÃO o sistema deve usar `await createSupabaseServerClient()`.

---

## 5. Diretrizes de Design (Tailwind v4)

O sistema deve usar a paleta oficial: #FF851B (brand), #20B2AA (accent), #FFF8F3 (bg light), #121214 (bg dark).
O sistema deve definir cores via @theme no globals.css — nunca valores rgb() arbitrários.
O sistema não deve alterar a paleta sem autorização explícita do product owner.
O sistema deve verificar contraste WCAG AA antes de combinar texto com fundo.

---

## 6. Harness — Pipeline de Verificação

ENQUANTO qualquer código for submetido ao repositório
O sistema deve passar por: TypeScript typecheck → ESLint → Next.js build → Vitest

O sistema deve manter cobertura mínima de testes críticos:
- Auth flows: 100%
- API routes com dados sensíveis (contato, RLS): 100%
- Server Actions de persistência: > 80%

SE o pipeline CI falhar
ENTÃO o deploy para produção deve ser bloqueado automaticamente.

---

## 7. Agentes n8n

O sistema deve usar mode "Tools Agent" em todos os agentes n8n — nunca Chain simples.
O sistema deve usar temperature ≤ 0.3 em agentes que acessam o banco.
O sistema não deve retornar Markdown em canais de mensageria (WhatsApp/Telegram).
O sistema deve validar payload de entrada com JSON Schema em todo webhook n8n.

SE o webhook n8n receber payload inválido
ENTÃO o agente deve logar o erro e retornar 400 sem criar registros corrompidos.

---

## 8. Resistência à Degradação de Contexto

O sistema deve reiniciar contexto da IA a cada funcionalidade nova.
O sistema deve injetar apenas: esta constituição + spec da feature atual.
O sistema não deve acumular histórico de múltiplas features na mesma sessão.

Comando de início de sessão:
> "Leia .specify/memory/constitution.md e specs/<feature>/spec.md.
>  Implemente TASK-X conforme tasks.md. Não altere outros módulos."
