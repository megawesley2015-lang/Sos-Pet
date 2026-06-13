-- ============================================================
-- Migration: Prestador Metrics — view_count, whatsapp_clicks, photos, events
-- Data: 2026-06-12
-- ============================================================

ALTER TABLE public.prestadores
  ADD COLUMN IF NOT EXISTS view_count       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_clicks  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS photos           JSONB   NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.prestador_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id  UUID NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL CHECK (event_type IN ('view','whatsapp_click')),
  city          TEXT,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prestador_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prestador_events_insert_public" ON public.prestador_events;
CREATE POLICY "prestador_events_insert_public"
  ON public.prestador_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "prestador_events_select_owner" ON public.prestador_events;
CREATE POLICY "prestador_events_select_owner"
  ON public.prestador_events FOR SELECT
  TO authenticated
  USING (
    prestador_id IN (
      SELECT id FROM public.prestadores WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_prestador_events_id_type_at
  ON public.prestador_events (prestador_id, event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_prestador_events_occurred
  ON public.prestador_events (occurred_at DESC);

CREATE OR REPLACE FUNCTION incrementar_visualizacao(p_prestador_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.prestadores
    SET view_count = view_count + 1
    WHERE id = p_prestador_id;
$$;
