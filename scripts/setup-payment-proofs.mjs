import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const paymentProofSQL = `
-- Create payment_proofs table to track payment submissions
CREATE TABLE IF NOT EXISTS payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id uuid NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  debt_ids uuid[] NOT NULL,
  receipt_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending_approval',
  submitted_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_proofs_condo_id_idx ON payment_proofs(condo_id);
CREATE INDEX IF NOT EXISTS payment_proofs_status_idx ON payment_proofs(status);
CREATE INDEX IF NOT EXISTS payment_proofs_created_at_idx ON payment_proofs(created_at DESC);

ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_view_payment_proofs" ON payment_proofs;
DROP POLICY IF EXISTS "users_can_insert_payment_proofs" ON payment_proofs;
DROP POLICY IF EXISTS "admins_can_update_payment_proofs" ON payment_proofs;

CREATE POLICY "users_can_view_payment_proofs"
ON payment_proofs FOR SELECT
TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "users_can_insert_payment_proofs"
ON payment_proofs FOR INSERT
TO authenticated
WITH CHECK (
  condo_id IN (
    SELECT condo_id FROM profiles WHERE id = auth.uid()
  )
  AND submitted_by = auth.uid()
);

CREATE POLICY "admins_can_update_payment_proofs"
ON payment_proofs FOR UPDATE
TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
`

async function setupPaymentProofs() {
  try {
    console.log('Setting up payment_proofs table...')
    console.log('Note: Run the SQL from scripts/039_create_payment_proofs_table.sql in your Supabase dashboard')
    console.log('Or execute this migration using the Supabase CLI')
    return true
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

setupPaymentProofs()
