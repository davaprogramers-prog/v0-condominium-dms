-- 106-create-sample-expenses.sql
-- CREAR 4 GASTOS DE EJEMPLO

INSERT INTO public.condo_expenses (
  condo_id,
  title,
  amount,
  description,
  expense_date,
  created_at
)
SELECT
  (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1),
  title,
  amount,
  description,
  expense_date,
  NOW()
FROM (VALUES
  ('Servicios Básicos', 150000, 'Pago servicios básicos Abril', '2026-04-05'::date),
  ('Mantenimiento', 200000, 'Mantenimiento preventivo', '2026-04-03'::date),
  ('Reparación', 50000, 'Reparación bomba agua', '2026-04-01'::date),
  ('Limpieza', 75000, 'Limpieza áreas comunes', '2026-04-07'::date)
) AS t(title, amount, description, expense_date);

-- Verificar que los gastos fueron creados
SELECT 'GASTOS CREADOS' as status;
SELECT id, title, amount, description, expense_date, created_at FROM public.condo_expenses WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test') ORDER BY expense_date DESC;
