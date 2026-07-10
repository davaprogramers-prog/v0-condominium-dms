-- Create payment_proofs table to track payment submissions
CREATE TABLE IF NOT EXISTS payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id uuid NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  debt_ids uuid[] NOT NULL,
  receipt_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending_approval', -- pending_approval, approved, rejected
  submitted_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS payment_proofs_condo_id_idx ON payment_proofs(condo_id);
CREATE INDEX IF NOT EXISTS payment_proofs_status_idx ON payment_proofs(status);
CREATE INDEX IF NOT EXISTS payment_proofs_created_at_idx ON payment_proofs(created_at DESC);

-- Enable RLS
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see payment proofs for their condo
CREATE POLICY "users_can_view_payment_proofs"
ON payment_proofs FOR SELECT
TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles WHERE id = auth.uid()
  )
);

-- Users can submit payment proofs
CREATE POLICY "users_can_insert_payment_proofs"
ON payment_proofs FOR INSERT
TO authenticated
WITH CHECK (
  condo_id IN (
    SELECT condo_id FROM profiles WHERE id = auth.uid()
  )
  AND submitted_by = auth.uid()
);

-- Admins can update payment proof status
CREATE POLICY "admins_can_update_payment_proofs"
ON payment_proofs FOR UPDATE
TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
