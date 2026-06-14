# learnings.md — Pet Aumigo
# Log de lições aprendidas (Anti-Erro)
# Formato: DATA | ERRO | CAUSA RAIZ | FIX | PREVENÇÃO
# ─────────────────────────────────────────────────────────────

## 2026-06-01

### L01 — Schema divergente entre componente e banco
**Erro:** `HallRreencontros.server.tsx` e `HeroSection.server.tsx` usavam colunas PT-BR
  (`nome`, `especie`, `status: 'resolvido'`) mas o schema real usa EN
  (`name`, `species`, `kind: 'lost'/'found'`, `status: 'active'/'resolved'`).
**Causa raiz:** Componentes foram gerados antes da consolidação do schema para inglês.
  O `CLAUDE.md` tinha schema desatualizado (PT-BR) enquanto o banco real já era EN.
**Fix:** Corrigir queries em ambos os server components para usar colunas reais.
  Adicionar try/catch com fallback para quando Supabase está indisponível.
**Prevenção:** Sempre verificar `supabase/schema.sql` antes de criar queries.
  Nunca confiar só no CLAUDE.md para nomes de colunas — é a 2ª fonte da verdade.

### L02 — Supabase free tier pausa após inatividade
**Erro:** "Connection closed." em TODAS as operações de auth e banco.
  Claude In Chrome passou 314 steps tentando debugar sem encontrar a causa.
**Causa raiz:** Projeto `odrybnjjpdxqjofgewam` pausado pelo free tier do Supabase.
**Fix:** Restore manual no dashboard Supabase (~2min).
**Prevenção:** Configurar alerta de inatividade no Supabase.
  Considerar upgrade para Pro ($25/mês) quando o produto tiver usuários reais.
  Alternativa: script de ping automático a cada 6 dias para evitar pausa.

### L03 — .env.local com project IDs misturados
**Erro:** `SUPABASE_SERVICE_ROLE_KEY` apontava para `enpgqgqinbdbvkqtnria`
  mas `NEXT_PUBLIC_SUPABASE_URL` apontava para `odrybnjjpdxqjofgewam`.
**Causa raiz:** Keys copiadas de projetos diferentes durante consolidação.
**Fix:** Verificar que TODOS os IDs de projeto em `.env.local` são do mesmo projeto.
**Prevenção:** Adicionar checklist pré-deploy: `grep supabase .env.local | sort | uniq -c`
  para detectar IDs diferentes no mesmo arquivo.

### L04 — HallRreencontros retornava null silenciosamente
**Erro:** Componente sumia da home sem nenhum log visível, deixando gap visual.
**Causa raiz:** `if (error || !data || data.length === 0) return null` sem fallback.
**Fix:** Adicionar mock data como fallback quando banco vazio ou inacessível.
  O mock mantém a prova social visível mesmo com DB pausado.
**Prevenção:** Server components de marketing NUNCA devem retornar null sem fallback visual.
  Regra: se o componente tem mocks planejados, implementar o fallback desde o início.
