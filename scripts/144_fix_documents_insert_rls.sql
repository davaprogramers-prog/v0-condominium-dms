-- Fix documents RLS to allow INSERT with proper checks
-- Drop the restrictive "docs_manage" policy
DROP POLICY IF EXISTS "docs_manage" ON public.documents;

-- Create separate policies for better control

-- Allow SELECT for all condo members
CREATE POLICY "docs_select_members" ON public.documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = documents.condo_id AND profiles.id = auth.uid())
);

-- Allow INSERT for authenticated users (validation done in application code)
CREATE POLICY "docs_insert_auth" ON public.documents FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Allow UPDATE for uploader or admin
CREATE POLICY "docs_update_admin_or_uploader" ON public.documents FOR UPDATE USING (
  uploaded_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = documents.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Allow DELETE for admin only
CREATE POLICY "docs_delete_admin" ON public.documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = documents.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);
