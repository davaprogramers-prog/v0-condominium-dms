-- Fix RLS Policies for Profiles Table
-- Run this in Supabase SQL Editor to allow conserje creation

-- Allow admins to insert new profiles for conserjes
CREATE POLICY "Allow admins to create profiles"
ON profiles FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'super_admin') 
    AND condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  )
);

-- Fix RLS for Visits Table
-- Allow users to create visits for their own houses
CREATE POLICY "Allow users to create visits for their houses"
ON visits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM houses 
    WHERE id = visits.house_id 
    AND owner_id = auth.uid()
  )
);

-- Allow admins to see all visits in their condo
CREATE POLICY "Allow admins to see all visits"
ON visits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM houses 
    WHERE id = visits.house_id 
    AND condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  )
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);
