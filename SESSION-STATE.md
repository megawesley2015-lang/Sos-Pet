# SESSION-STATE.md — SOS Pet Aumigo
# WAL (Write-Ahead Log) de estado da sessão atual
# ─────────────────────────────────────────────────────────────
# REGRA /dream: A cada 5 sessões, consolidar este arquivo → MEMORY.md
# Última consolidação: 2026-06-08
# ─────────────────────────────────────────────────────────────

## Estado em: 2026-06-16 — JOEL JOTA VIDEOS + 3 SPECS IMPLEMENTADOS

### Concluído nesta sessão
- [x] Transcrição + brain dos 6 vídeos Joel Jota → `.claude/brain/joel-jota-videos.md`
- [x] Página `/para-prestadores` — landing B2B completa (commit `fc03ab4`)
- [x] Migration `avaliacoes_prestadores` SQL + trigger sync_prestador_avaliacao (commit `d27a8b3`)
- [x] PWA completo: manifest.json + sw.js push handler + API routes + NotificationOptIn (commit `6cfbc38`)
- [x] Specs done: onboarding-tutor ✓, avaliacoes-prestadores ✓, pwa-push ✓

### Próxima sessão — o que fazer primeiro
1. **Deploy** → `git push origin main` → Vercel CI/CD
2. **Supabase** → Aplicar migrations: 20260616_avaliacoes_prestadores + 20260616_push_subscriptions
3. **VAPID keys** → Gerar com `npx web-push generate-vapid-keys` + adicionar ao .env.local e Vercel
4. **`busca-foto`** spec — matching por imagem (AI-First do Joel Jota)
5. **Ícones PWA** → Criar icon-192.png e icon-512.png em /public/

### Estado do repositório
- Branch: main
- Último commit: 6cfbc38 (PWA push notifications)
- TypeScript: 0 erros
- Specs: onboarding-tutor ✓, avaliacoes-prestadores ✓, pwa-push ✓, busca-foto ⏳, mapa-calor ⏳, lgpd-painel ⏳
- Migrations pendentes de deploy: 20260616_avaliacoes_prestadores, 20260616_push_subscriptions
- Env vars novas necessárias: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, PUSH_SEND_SECRET

---

## Regras WAL (não apagar)
- REGRA 1: Atualizar este arquivo antes de qualquer decisão de arquitetura
- REGRA 2: Se um erro ocorrer 2 vezes → registrar em MEMORY.md
- REGRA 3: Nunca ignorar políticas de RLS em novas tabelas
- REGRA 4: Commits atômicos — não misturar contextos diferentes
- REGRA /dream: A cada 5 sessões → consolidar para MEMORY.md
