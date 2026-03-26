-- Ensure users can update their own profile (specifically condo_id for switching)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow super_admin to update any profile
DROP POLICY IF EXISTS "Super admin can update any profile" ON profiles;

CREATE POLICY "Super admin can update any profile" ON profiles
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);
