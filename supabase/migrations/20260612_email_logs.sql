-- ============================================================
-- Migration: Email Logs
-- Data: 2026-06-12
-- SHA256 do email — nunca plaintext
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email_hash  TEXT NOT NULL,
  template_name  TEXT NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('sent','failed')),
  error_message  TEXT,
  resend_id      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Apenas service_role acessa logs — usuários comuns não têm acesso
DROP POLICY IF EXISTS "email_logs_no_public_access" ON public.email_logs;
CREATE POLICY "email_logs_no_public_access"
  ON public.email_logs FOR ALL
  USING (false);

CREATE INDEX IF NOT EXISTS idx_email_logs_template_status
  ON public.email_logs (template_name, status);

CREATE INDEX IF NOT EXISTS idx_email_logs_hash_template
  ON public.email_logs (to_email_hash, template_name);
