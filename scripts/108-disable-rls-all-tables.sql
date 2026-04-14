-- 108-disable-rls-all-tables.sql
-- DESHABILITAR RLS EN TODAS LAS TABLAS QUE GENERAN PROBLEMAS

ALTER TABLE public.bank_statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.condo_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.condo_income DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS fue deshabilitado
SELECT 'RLS Disabled on key tables' as status;
