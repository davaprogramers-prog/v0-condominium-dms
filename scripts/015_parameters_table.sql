-- Parameters table for storing system configuration (current month, thresholds, etc)
CREATE TABLE IF NOT EXISTS parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  current_month INT NOT NULL DEFAULT EXTRACT(MONTH FROM NOW()),
  current_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  payment_deadline_day INT NOT NULL DEFAULT 5,
  late_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  enable_late_fees BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(condo_id)
);

-- Enable RLS
ALTER TABLE parameters ENABLE ROW LEVEL SECURITY;

-- Admin can read/write their condo's parameters
CREATE POLICY "admins_manage_parameters"
  ON parameters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.condo_id = parameters.condo_id
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.condo_id = parameters.condo_id
      AND p.role = 'admin'
    )
  );

-- Owners can only read their condo's parameters
CREATE POLICY "owners_read_parameters"
  ON parameters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.condo_id = parameters.condo_id
    )
  );
