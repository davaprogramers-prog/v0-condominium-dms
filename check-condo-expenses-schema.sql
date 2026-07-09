-- Verificar estructura de tabla condo_expenses
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'condo_expenses'
ORDER BY ordinal_position;
