-- Make all expense logos global by setting condo_id to NULL
UPDATE public.expense_logos
SET condo_id = NULL
WHERE condo_id IS NOT NULL;

-- Verify the update
SELECT id, name, condo_id, logo_url FROM public.expense_logos ORDER BY name;
