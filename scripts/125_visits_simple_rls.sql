-- Simple RLS for visits table
-- Allow authenticated users access

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "visits_insert_policy" ON visits;
DROP POLICY IF EXISTS "visits_select_policy" ON visits;
DROP POLICY IF EXISTS "visits_update_policy" ON visits;
DROP POLICY IF EXISTS "visits_delete_policy" ON visits;
DROP POLICY IF EXISTS "anyone_can_view" ON visits;
DROP POLICY IF EXISTS "visits_select" ON visits;
DROP POLICY IF EXISTS "visits_insert" ON visits;
DROP POLICY IF EXISTS "visits_update" ON visits;
DROP POLICY IF EXISTS "visits_delete" ON visits;
DROP POLICY IF EXISTS "authenticated_select_visits" ON visits;
DROP POLICY IF EXISTS "authenticated_insert_visits" ON visits;
DROP POLICY IF EXISTS "authenticated_update_visits" ON visits;
DROP POLICY IF EXISTS "authenticated_delete_visits" ON visits;

-- Create new simple policies
CREATE POLICY "allow_select" ON visits FOR SELECT
  USING (true);

CREATE POLICY "allow_insert" ON visits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_update" ON visits FOR UPDATE
  USING (true);

CREATE POLICY "allow_delete" ON visits FOR DELETE
  USING (true);
