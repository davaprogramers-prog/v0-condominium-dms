-- Disable RLS on document_types table only
ALTER TABLE public.document_types DISABLE ROW LEVEL SECURITY;
SELECT 'document_types RLS disabled' as status;
