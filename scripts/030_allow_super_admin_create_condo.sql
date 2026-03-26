-- Allow super_admin to insert new condominiums
CREATE POLICY "Super admin can create condominiums" ON condominiums
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Allow super_admin to update condominiums
CREATE POLICY "Super admin can update condominiums" ON condominiums
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Allow super_admin to delete condominiums
CREATE POLICY "Super admin can delete condominiums" ON condominiums
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);
