-- Migration: onboarding_tutor
-- Adiciona campo de controle de onboarding na tabela profiles.
-- Usa IF NOT EXISTS para ser idempotente.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
