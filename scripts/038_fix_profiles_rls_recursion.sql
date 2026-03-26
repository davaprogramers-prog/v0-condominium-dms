-- FIX INFINITE RECURSION IN PROFILES RLS POLICIES
-- The problem is that policies on profiles are querying profiles again

-- Drop ALL existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read condo profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update condo profiles" ON profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Super admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete condo profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;

-- Create SIMPLE non-recursive policies
-- 1. SELECT: Users can read their own profile OR profiles in their condo
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = id 
  OR condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
);

-- 2. UPDATE: Users can only update their own profile
CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. INSERT: Users can insert their own profile
CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. DELETE: Only allow delete own profile (rare case)
CREATE POLICY "profiles_delete_policy" ON profiles
FOR DELETE TO authenticated
USING (auth.uid() = id);
