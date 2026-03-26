-- Remove the category check constraint to allow custom expense types
ALTER TABLE condo_expenses DROP CONSTRAINT IF EXISTS condo_expenses_category_check;

-- Also remove from condo_income if it exists
ALTER TABLE condo_income DROP CONSTRAINT IF EXISTS condo_income_income_type_check;
