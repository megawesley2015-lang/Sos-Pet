-- ============================================================
-- Migration: Notificações — subscriptions + logs
-- Data: 2026-06-12
-- ============================================================

-- ── notification_subscriptions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city       TEXT NOT NULL,
  channel    TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, city, channel)
);

ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_sub_owner" ON public.notification_subscriptions;
CREATE POLICY "notif_sub_owner"
  ON public.notification_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notif_sub_user_active
  ON public.notification_subscriptions (user_id, active);

-- ── notification_logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id        UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id       UUID,
  channel       TEXT CHECK (channel IN ('whatsapp', 'email', 'system')),
  status        TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'no_recipients', 'rate_limited')),
  error_message TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_logs_owner_select" ON public.notification_logs;
CREATE POLICY "notif_logs_owner_select"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (SELECT owner_id FROM public.pets WHERE id = pet_id)
  );

CREATE INDEX IF NOT EXISTS idx_notif_logs_pet_user
  ON public.notification_logs (pet_id, user_id);

CREATE INDEX IF NOT EXISTS idx_notif_logs_pet_status
  ON public.notification_logs (pet_id, status);
