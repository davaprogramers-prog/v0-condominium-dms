-- Disable RLS on document_types table to allow full access
-- This is a catalog table that should be managed by admins only
ALTER TABLE public.document_types DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'document_types';
