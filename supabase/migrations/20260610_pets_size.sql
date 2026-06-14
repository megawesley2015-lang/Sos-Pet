-- Migration: adicionar coluna size em pets com CHECK constraint e índice
-- Idempotente: seguro rodar múltiplas vezes

-- 1. Garantir que a coluna existe (no-op se já existir)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS size TEXT;

-- 2. Adicionar CHECK constraint apenas se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pets_size_check'
      AND conrelid = 'pets'::regclass
  ) THEN
    ALTER TABLE pets
      ADD CONSTRAINT pets_size_check
      CHECK (size IN ('small', 'medium', 'large'));
  END IF;
END $$;

-- 3. Índice parcial para filtros por porte
CREATE INDEX IF NOT EXISTS idx_pets_size ON pets(size) WHERE size IS NOT NULL;
