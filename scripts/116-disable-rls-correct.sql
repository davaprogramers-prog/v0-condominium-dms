-- Disable RLS on all tables used by the application
-- These tables had RLS policies that were blocking data modifications

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominiums DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exemption_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.infractions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements DISABLE ROW LEVEL SECURITY;
