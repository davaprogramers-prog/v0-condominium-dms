-- Fix documents RLS policy to allow admin uploads
DROP POLICY IF EXISTS "docs_manage" ON public.documents;

-- Allow SELECT for all members
CREATE POLICY "docs_select" ON public.documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = documents.condo_id AND profiles.id = auth.uid())
);

-- Allow INSERT for admins
CREATE POLICY "docs_insert_admin" ON public.documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = documents.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Allow UPDATE for admins  
CREATE POLICY "docs_update_admin" ON public.documents FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = documents.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Allow DELETE for admins
CREATE POLICY "docs_delete_admin" ON public.documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = documents.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);
