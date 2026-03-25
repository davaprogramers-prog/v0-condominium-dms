-- Add income amount fields to parameters table
ALTER TABLE parameters ADD COLUMN IF NOT EXISTS fixed_income_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE parameters ADD COLUMN IF NOT EXISTS variable_income_amount NUMERIC(12,2) DEFAULT 0;

-- Create payment_proofs table for storing payment receipts uploaded by owners
CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Payment details
  period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  period_year INTEGER NOT NULL CHECK (period_year >= 2020),
  
  -- Amounts
  fixed_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  variable_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (fixed_amount + variable_amount) STORED,
  
  -- Receipt file
  receipt_url TEXT NOT NULL,
  notes TEXT,
  
  -- Status: pending, approved, rejected
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Links to created income records (when approved)
  fixed_income_id UUID REFERENCES condo_income(id),
  variable_income_id UUID REFERENCES condo_income(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_proofs_condo_period ON payment_proofs(condo_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_house ON payment_proofs(house_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON payment_proofs(status);

-- Enable RLS
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payment proofs or all if admin
CREATE POLICY "Users can view own payment proofs" ON payment_proofs
  FOR SELECT USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_condos uc
      WHERE uc.condo_id = payment_proofs.condo_id
      AND uc.user_id = auth.uid()
      AND uc.role = 'admin'
    )
  );

-- Policy: Users can insert their own payment proofs
CREATE POLICY "Users can insert own payment proofs" ON payment_proofs
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Policy: Only admins can update payment proofs
CREATE POLICY "Admins can update payment proofs" ON payment_proofs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_condos uc
      WHERE uc.condo_id = payment_proofs.condo_id
      AND uc.user_id = auth.uid()
      AND uc.role = 'admin'
    )
  );
