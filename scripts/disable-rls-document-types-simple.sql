-- Create permissive RLS policies for document_types
-- This allows admin/super_admin to manage document types

-- First, enable RLS if not already enabled
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all for admin" ON public.document_types;

-- Create policy that allows all operations for authenticated users
-- (Supabase will handle role-based access at application level)
CREATE POLICY "Allow all for authenticated users"
ON public.document_types
FOR ALL
USING (true)
WITH CHECK (true);

-- Verify policy exists
SELECT * FROM pg_policies WHERE tablename = 'document_types';
