-- CLEANUP SCRIPT: Revert Supabase to state before Capacitor installation
-- This removes all tables and changes created after commit 19a252f
-- Execute this in Supabase SQL Editor to restore clean state

-- 1. Drop tables created after 19a252f
DROP TABLE IF EXISTS public.visits CASCADE;
DROP TABLE IF EXISTS public.concierges CASCADE;
DROP TABLE IF EXISTS public.logos CASCADE;

-- 2. Restore profiles table to original RLS policies
-- Remove any new policies added for conserje role
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Recreate original RLS policies for profiles (if they were modified)
-- These should match the state at commit 19a252f
CREATE POLICY "Enable read access for authenticated users on own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR auth.jwt()->'app_metadata'->>'role' = 'super_admin');

CREATE POLICY "Enable update for users on own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id OR auth.jwt()->'app_metadata'->>'role' = 'super_admin');

-- 4. Verify cleanup
SELECT 'Cleanup complete. Tables in public schema:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
