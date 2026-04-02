-- RLS Policy Fix: Allow admins to see conserjes in their condominio
-- This policy allows admin and super_admin roles to view conserje profiles in their condo

-- First, check existing policies
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'profiles';

-- DROP existing policy if it blocks admin viewing
-- DROP POLICY IF EXISTS "Admins can view conserjes" ON profiles;

-- CREATE NEW POLICY: Admins can read conserje profiles in their condo
CREATE POLICY "Admins can view conserjes"
ON profiles
FOR SELECT
USING (
  -- Allow users to see conserjes in their own condo if they are admin/super_admin
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE (role = 'admin' OR role = 'super_admin') 
    AND condo_id = profiles.condo_id
  )
  AND (role = 'conserje' OR auth.uid() = id)
);

-- Or simpler alternative: Allow all authenticated users to see conserjes
-- CREATE POLICY "Anyone can view conserjes"
-- ON profiles
-- FOR SELECT
-- USING (role = 'conserje' OR auth.uid() = id);

-- If above doesn't work, disable RLS temporarily to test:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
