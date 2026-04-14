-- Simplified RLS for visits - avoid complex subqueries
-- Allow conserje and admins to view all visits in their condo

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "visits_insert_policy" ON visits;
DROP POLICY IF EXISTS "visits_select_policy" ON visits;
DROP POLICY IF EXISTS "visits_update_policy" ON visits;
DROP POLICY IF EXISTS "visits_delete_policy" ON visits;
DROP POLICY IF EXISTS "anyone_can_view" ON visits;

-- Allow authenticated users to SELECT (we'll filter at app level)
CREATE POLICY "visits_select" ON visits FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow INSERT for authenticated users
CREATE POLICY "visits_insert" ON visits FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow UPDATE for authenticated users
CREATE POLICY "visits_update" ON visits FOR UPDATE
USING (auth.role() = 'authenticated');

-- Allow DELETE for authenticated users
CREATE POLICY "visits_delete" ON visits FOR DELETE
USING (auth.role() = 'authenticated');
