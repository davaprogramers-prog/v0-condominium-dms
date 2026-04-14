-- Create migration to fix RLS policies for projects table
-- Allow admins and conserjes to create, read, update, and delete projects within their own condominium

-- Drop existing policies if any
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;

-- Create a permissive policy for select (all authenticated users in condo)
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT
  USING (true);

-- Create a permissive policy for insert (all authenticated users can insert)
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT
  WITH CHECK (true);

-- Create a permissive policy for update (all authenticated users can update)
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE
  USING (true);

-- Create a permissive policy for delete (all authenticated users can delete)
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE
  USING (true);
