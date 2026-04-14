-- Fix RLS policies for visits table to allow conserje to see all visits in their condo

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that don't include conserje
DROP POLICY IF EXISTS "visits_insert_policy" ON visits;
DROP POLICY IF EXISTS "visits_select_policy" ON visits;
DROP POLICY IF EXISTS "visits_update_policy" ON visits;
DROP POLICY IF EXISTS "visits_delete_policy" ON visits;

-- Insert policy: allow staff (conserje, admin, super_admin) and owners to insert visits
CREATE POLICY "visits_insert_policy" ON visits FOR INSERT
WITH CHECK (
  -- Allow staff (conserje, admin, super_admin) from same condo
  ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('conserje', 'admin', 'super_admin')
   AND (SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id)
  OR
  -- Allow property owners to insert visits for their own houses
  ((SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id
   AND (SELECT id FROM profiles WHERE id = auth.uid() AND role = 'owner') IS NOT NULL
   AND house_id IN (
     SELECT id FROM houses WHERE owner_id = auth.uid()
   ))
);

-- Select policy: staff can see all visits in their condo, owners see their own
CREATE POLICY "visits_select_policy" ON visits FOR SELECT
USING (
  -- Staff (conserje, admin, super_admin) in same condo can see all visits
  ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('conserje', 'admin', 'super_admin')
   AND (SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id)
  OR
  -- User is the owner of the house
  house_id IN (SELECT id FROM houses WHERE owner_id = auth.uid())
  OR
  -- User created the visit
  created_by = auth.uid()
);

-- Update policy: staff and creators can update
CREATE POLICY "visits_update_policy" ON visits FOR UPDATE
USING (
  -- Staff (conserje, admin, super_admin) in same condo
  ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('conserje', 'admin', 'super_admin')
   AND (SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id)
  OR
  -- Creator can update their own visits
  created_by = auth.uid()
);

-- Delete policy: staff and creators can delete
CREATE POLICY "visits_delete_policy" ON visits FOR DELETE
USING (
  -- Staff (conserje, admin, super_admin) in same condo
  ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('conserje', 'admin', 'super_admin')
   AND (SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id)
  OR
  -- Creator can delete their own visits
  created_by = auth.uid()
);
