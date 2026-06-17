-- ============================================================
-- Migration: Push Subscriptions (Web Push / PWA)
-- Data: 2026-06-16
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL UNIQUE,
  keys        JSONB       NOT NULL,
  cidade      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- SELECT: apenas o próprio usuário vê suas subscriptions
DROP POLICY IF EXISTS "push_sub_select_owner" ON public.push_subscriptions;
CREATE POLICY "push_sub_select_owner"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: apenas autenticado (user_id = auth.uid() obrigatório)
DROP POLICY IF EXISTS "push_sub_insert_auth" ON public.push_subscriptions;
CREATE POLICY "push_sub_insert_auth"
  ON public.push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE: apenas o próprio usuário pode remover
DROP POLICY IF EXISTS "push_sub_delete_owner" ON public.push_subscriptions;
CREATE POLICY "push_sub_delete_owner"
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_push_sub_user
  ON public.push_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_push_sub_cidade
  ON public.push_subscriptions (cidade)
  WHERE cidade IS NOT NULL;
