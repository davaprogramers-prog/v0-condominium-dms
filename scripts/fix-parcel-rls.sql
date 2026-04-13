-- Fix the RLS policies that have issues

-- Drop problematic policies
DROP POLICY IF EXISTS "Conserje can insert parcels in their condo" ON parcels;
DROP POLICY IF EXISTS "Conserje can update parcels in their condo if recibido" ON parcels;

-- Recreate INSERT policy with correct syntax
CREATE POLICY "Conserje can insert parcels in their condo" ON parcels
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'conserje'
      AND condo_id = parcels.condo_id
    )
  );

-- Recreate UPDATE policy with correct syntax
CREATE POLICY "Conserje can update parcels in their condo if recibido" ON parcels
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT pr.id FROM profiles pr
      WHERE pr.role = 'conserje'
      AND pr.condo_id = parcels.condo_id
      AND parcels.status = 'recibido'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT pr.id FROM profiles pr
      WHERE pr.role = 'conserje'
      AND pr.condo_id = parcels.condo_id
    )
  );
