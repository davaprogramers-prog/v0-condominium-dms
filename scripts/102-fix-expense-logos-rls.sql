-- Fix Row-Level Security policies for expense_logos table to allow global logos (condo_id = null)

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can view expense_logos" ON expense_logos;
DROP POLICY IF EXISTS "Admins can insert expense_logos" ON expense_logos;
DROP POLICY IF EXISTS "Admins can update expense_logos" ON expense_logos;
DROP POLICY IF EXISTS "Admins can delete expense_logos" ON expense_logos;

-- Enable RLS on expense_logos table
ALTER TABLE expense_logos ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view all expense_logos (global)
CREATE POLICY "Anyone can view expense_logos"
  ON expense_logos
  FOR SELECT
  USING (true);

-- Policy: Super admins can insert expense_logos (including global logos with condo_id = null)
CREATE POLICY "Super admins can insert expense_logos"
  ON expense_logos
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'super_admin'
    )
  );

-- Policy: Super admins can update expense_logos
CREATE POLICY "Super admins can update expense_logos"
  ON expense_logos
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'super_admin'
    )
  );

-- Policy: Super admins can delete expense_logos
CREATE POLICY "Super admins can delete expense_logos"
  ON expense_logos
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'super_admin'
    )
  );
