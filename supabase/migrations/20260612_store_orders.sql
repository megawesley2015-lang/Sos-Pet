-- ============================================================
-- Migration: Store Orders + store_products enhancements
-- Data: 2026-06-12
-- ============================================================

ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS variants  JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS in_stock  BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.store_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  items             JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_brl      DECIMAL(10,2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','shipped','delivered','cancelled','refunded')),
  mp_preference_id  TEXT,
  mp_payment_id     TEXT,
  printful_order_id TEXT,
  printful_error    TEXT,
  shipping_address  JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_orders_owner_select" ON public.store_orders;
CREATE POLICY "store_orders_owner_select"
  ON public.store_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "store_orders_owner_insert" ON public.store_orders;
CREATE POLICY "store_orders_owner_insert"
  ON public.store_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_store_orders_user_created
  ON public.store_orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_store_orders_mp_payment
  ON public.store_orders (mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_store_orders_status
  ON public.store_orders (status);

CREATE OR REPLACE FUNCTION update_store_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_store_orders_updated_at ON public.store_orders;
CREATE TRIGGER trg_store_orders_updated_at
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW EXECUTE FUNCTION update_store_orders_updated_at();
