-- ============================================================
-- Migration: Admin Panel — reports + admin_actions
-- Data: 2026-06-12
-- ============================================================

-- Garante que a coluna role existe em profiles (idempotente)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT
  CHECK (role IN ('user','admin','moderator','banned'))
  DEFAULT 'user';

-- ── Tabela: reports ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type    TEXT NOT NULL CHECK (target_type IN ('pet','sighting')),
  target_id      UUID NOT NULL,
  reason         TEXT NOT NULL CHECK (reason IN ('spam','inappropriate_photo','wrong_info','other')),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reporter_id, target_type, target_id)
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert_authenticated" ON public.reports;
CREATE POLICY "reports_insert_authenticated"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_owner_or_admin" ON public.reports;
CREATE POLICY "reports_select_owner_or_admin"
  ON public.reports FOR SELECT
  USING (
    auth.uid() = reporter_id
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin','moderator'))
  );

DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;
CREATE POLICY "reports_update_admin"
  ON public.reports FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin','moderator'))
  );

CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status  ON public.reports (status);

-- ── Tabela: admin_actions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES auth.users(id),
  action_type  TEXT NOT NULL CHECK (action_type IN (
    'remove_pet','restore_pet','ban_user','dismiss_report','approve_content'
  )),
  target_id    UUID NOT NULL,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_actions_admin_only" ON public.admin_actions;
CREATE POLICY "admin_actions_admin_only"
  ON public.admin_actions FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin','moderator'))
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin','moderator'))
  );

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON public.admin_actions (admin_id);
