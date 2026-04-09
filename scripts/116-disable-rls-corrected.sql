-- Desabilitar RLS solo en tablas que existen y necesitan ser modificables
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exemption_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.infractions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.condo_income DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.condo_expenses DISABLE ROW LEVEL SECURITY;
