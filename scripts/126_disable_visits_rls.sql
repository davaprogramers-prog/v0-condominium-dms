-- Remove all RLS policies from visits table
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
DROP POLICY IF EXISTS "allow_select" ON visits;
DROP POLICY IF EXISTS "allow_insert" ON visits;
DROP POLICY IF EXISTS "allow_update" ON visits;
DROP POLICY IF EXISTS "allow_delete" ON visits;
DROP POLICY IF EXISTS "Staff can view visits" ON visits;
DROP POLICY IF EXISTS "Propietarios can view their visits" ON visits;
DROP POLICY IF EXISTS "Anyone can create visits" ON visits;

-- Disable RLS completely to allow access
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
