-- Check and disable RLS on expense_logos if blocking global access
ALTER TABLE public.expense_logos DISABLE ROW LEVEL SECURITY;

-- Verify the table structure
SELECT * FROM public.expense_logos LIMIT 5;
