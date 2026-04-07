-- 106-create-sample-expenses.sql
-- CREAR 4 GASTOS DE EJEMPLO

WITH condo AS (
  SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1
),
expense_type_data AS (
  SELECT id, name FROM public.expense_types 
  WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test')
  LIMIT 1
)
INSERT INTO public.condo_expenses (
  condo_id,
  expense_type_id,
  amount,
  description,
  date,
  created_at
)
SELECT
  condo.id,
  (SELECT id FROM expense_type_data),
  amount,
  description,
  date,
  NOW()
FROM condo,
(VALUES
  (150000, 'Pago servicios básicos Abril', '2026-04-05'::date),
  (200000, 'Mantenimiento preventivo', '2026-04-03'::date),
  (50000, 'Reparación bomba agua', '2026-04-01'::date),
  (75000, 'Limpieza áreas comunes', '2026-04-07'::date)
) AS t(amount, description, date);

-- Verificar que los gastos fueron creados
SELECT 'GASTOS CREADOS' as status;
SELECT id, amount, description, date FROM public.condo_expenses WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test') ORDER BY date DESC;
