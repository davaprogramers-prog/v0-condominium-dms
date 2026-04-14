-- Disable RLS on projects table
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on project_quotes table
ALTER TABLE public.project_quotes DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies if they exist
DROP POLICY IF EXISTS projects_select ON public.projects;
DROP POLICY IF EXISTS projects_insert ON public.projects;
DROP POLICY IF EXISTS projects_update ON public.projects;
DROP POLICY IF EXISTS projects_delete ON public.projects;

DROP POLICY IF EXISTS project_quotes_select ON public.project_quotes;
DROP POLICY IF EXISTS project_quotes_insert ON public.project_quotes;
DROP POLICY IF EXISTS project_quotes_update ON public.project_quotes;
DROP POLICY IF EXISTS project_quotes_delete ON public.project_quotes;
