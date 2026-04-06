-- Fix RLS policy for visits table to allow owners to insert visits
-- This corrects the logic to properly handle inserts without circular references

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "visits_insert_policy" ON visits;
DROP POLICY IF EXISTS "visits_select_policy" ON visits;
DROP POLICY IF EXISTS "visits_update_policy" ON visits;
DROP POLICY IF EXISTS "visits_delete_policy" ON visits;

-- Create insert policy: allow owners/admins to insert visits for their condominium
CREATE POLICY "visits_insert_policy" ON visits FOR INSERT
WITH CHECK (
  -- Allow admins and super_admins from same condo
  ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
   AND (SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id)
  OR
  -- Allow property owners to insert visits for their own houses
  ((SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id
   AND (SELECT id FROM profiles WHERE id = auth.uid() AND role = 'owner') IS NOT NULL
   AND house_id IN (
     SELECT id FROM houses WHERE owner_id = auth.uid()
   ))
);

-- Select policy: users can see visits in their condominium or visits they created
CREATE POLICY "visits_select_policy" ON visits FOR SELECT
USING (
  -- User is in the same condo
  (SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id
  OR
  -- User is the owner of the house
  house_id IN (SELECT id FROM houses WHERE owner_id = auth.uid())
  OR
  -- User created the visit
  created_by = auth.uid()
);

-- Update policy: admins and creators can update
CREATE POLICY "visits_update_policy" ON visits FOR UPDATE
USING (
  -- Admins/super_admins in same condo
  ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
   AND (SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id)
  OR
  -- Creator can update their own visits
  created_by = auth.uid()
);

-- Delete policy: admins and creators can delete
CREATE POLICY "visits_delete_policy" ON visits FOR DELETE
USING (
  -- Admins/super_admins in same condo
  ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
   AND (SELECT condo_id FROM profiles WHERE id = auth.uid()) = condo_id)
  OR
  -- Creator can delete their own visits
  created_by = auth.uid()
);
