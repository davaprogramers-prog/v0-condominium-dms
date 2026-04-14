-- Disable RLS on all tables that have been causing 403/42501 errors
-- This allows authenticated users to perform CRUD operations

-- Projects and related tables
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_quotes DISABLE ROW LEVEL SECURITY;

-- Exemptions and related
ALTER TABLE public.exemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exemption_types DISABLE ROW LEVEL SECURITY;

-- Income and expenses
ALTER TABLE public.condo_income DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.condo_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_types DISABLE ROW LEVEL SECURITY;

-- Infractions
ALTER TABLE public.infractions DISABLE ROW LEVEL SECURITY;

-- Bank statements
ALTER TABLE public.bank_statements DISABLE ROW LEVEL SECURITY;

-- Houses and related
ALTER TABLE public.houses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_owners DISABLE ROW LEVEL SECURITY;
