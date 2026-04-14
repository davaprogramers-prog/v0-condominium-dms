-- Fix RLS policy for document_types to allow super_admin to create new types
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow super_admin to manage document_types" ON public.document_types;
DROP POLICY IF EXISTS "document_types_select_policy" ON public.document_types;
DROP POLICY IF EXISTS "document_types_insert_policy" ON public.document_types;
DROP POLICY IF EXISTS "document_types_update_policy" ON public.document_types;
DROP POLICY IF EXISTS "document_types_delete_policy" ON public.document_types;

-- Create permissive policy for super_admin
CREATE POLICY "Allow super_admin to manage document_types"
ON public.document_types
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'super_admin' OR profiles.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'super_admin' OR profiles.role = 'admin')
  )
);

-- Also allow public read access to document types (for display purposes)
CREATE POLICY "Allow public to read document_types"
ON public.document_types
FOR SELECT
USING (true);
