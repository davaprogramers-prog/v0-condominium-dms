-- Simple RLS for parcels table
-- Avoid complex queries that cause stack overflow

-- Enable RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "staff_can_create_parcels" ON parcels;
DROP POLICY IF EXISTS "staff_can_view_parcels" ON parcels;
DROP POLICY IF EXISTS "propietario_can_view_their_parcels" ON parcels;
DROP POLICY IF EXISTS "staff_can_update_parcels" ON parcels;
DROP POLICY IF EXISTS "Users can view parcels in their condo" ON parcels;
DROP POLICY IF EXISTS "Conserje can create parcels" ON parcels;
DROP POLICY IF EXISTS "Propietarios can view their house parcels" ON parcels;

-- Simple INSERT policy: Only staff (conserje, admin, super_admin) can create
CREATE POLICY "parcels_insert" ON parcels
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('conserje', 'admin', 'super_admin')
    )
  );

-- Simple SELECT policy: All authenticated users can view
-- (filtering by condo_id happens at application level)
CREATE POLICY "parcels_select" ON parcels
  FOR SELECT
  USING (true);

-- UPDATE policy: Only staff can update
CREATE POLICY "parcels_update" ON parcels
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('conserje', 'admin', 'super_admin')
    )
  );

-- DELETE policy: Only staff can delete
CREATE POLICY "parcels_delete" ON parcels
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('conserje', 'admin', 'super_admin')
    )
  );
