-- Fix RLS policy for visits table to allow owners to insert visits
-- This policy allows authenticated users to insert visits for their own condominium and house

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "visits_insert_policy" ON visits;

-- Create new insert policy that allows owners and admins to insert visits
CREATE POLICY "visits_insert_policy" ON visits FOR INSERT
WITH CHECK (
  -- Allow if user is an admin or super_admin
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  OR
  -- Allow if user is the owner of the house they're creating a visit for
  (SELECT id FROM profiles WHERE id = auth.uid() AND condo_id = (SELECT condo_id FROM visits WHERE id = visits.id LIMIT 1))
);

-- Ensure select, update, delete policies exist
DROP POLICY IF EXISTS "visits_select_policy" ON visits;
CREATE POLICY "visits_select_policy" ON visits FOR SELECT
USING (
  -- Allow if user is admin/super_admin in the same condo
  (SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id
  OR
  -- Allow if user created the visit
  created_by = auth.uid()
);

DROP POLICY IF EXISTS "visits_update_policy" ON visits;
CREATE POLICY "visits_update_policy" ON visits FOR UPDATE
USING (
  -- Allow if user is admin/super_admin in the same condo
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  AND (SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id
  OR
  -- Allow if user created the visit
  created_by = auth.uid()
);

DROP POLICY IF EXISTS "visits_delete_policy" ON visits;
CREATE POLICY "visits_delete_policy" ON visits FOR DELETE
USING (
  -- Allow if user is admin/super_admin in the same condo
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  AND (SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id
  OR
  -- Allow if user created the visit
  created_by = auth.uid()
);
