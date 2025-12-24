-- Migration: Affiliate Commissions Ledger System
-- This replaces the direct pending_payout updates with a proper ledger

-- 1. Create payout batches table (for tracking CSV exports)
CREATE TABLE IF NOT EXISTS affiliate_payout_batches (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('created', 'paid', 'void')) DEFAULT 'created',
  total_amount_cents INT DEFAULT 0,
  affiliate_count INT DEFAULT 0,
  notes TEXT,
  paid_at TIMESTAMPTZ
);

-- 2. Create commissions ledger table
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id SERIAL PRIMARY KEY,
  affiliate_id INT REFERENCES affiliates(id),
  affiliate_code TEXT NOT NULL,
  
  -- Stripe identifiers for reconciliation
  stripe_event_id TEXT UNIQUE,
  checkout_session_id TEXT,
  payment_intent_id TEXT,
  invoice_id TEXT,
  subscription_id TEXT,
  customer_id TEXT,
  customer_email TEXT,
  
  -- Product and amount
  product_key TEXT NOT NULL,  -- operator_monthly | operator_annual
  currency TEXT DEFAULT 'usd',
  gross_amount_cents INT NOT NULL,
  commission_cents INT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('pending', 'cleared', 'paid', 'reversed')) DEFAULT 'pending',
  eligible_at TIMESTAMPTZ NOT NULL,  -- created_at + 14 days
  paid_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  reversal_reason TEXT,
  
  -- Batch tracking (for payout exports)
  batch_id INT REFERENCES affiliate_payout_batches(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_status ON affiliate_commissions (affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_eligible_at ON affiliate_commissions (eligible_at);
CREATE INDEX IF NOT EXISTS idx_commissions_payment_intent ON affiliate_commissions (payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_checkout_session ON affiliate_commissions (checkout_session_id);

-- 3. Add refund tracking columns to affiliates table
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS refund_count INT DEFAULT 0;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS last_refund_at TIMESTAMPTZ;

-- Note: After this migration, the affiliates.pending_payout, total_earnings, etc. 
-- become DERIVED from the commissions ledger, not the source of truth.
-- We keep them for backward compatibility but they should be recalculated from ledger.
