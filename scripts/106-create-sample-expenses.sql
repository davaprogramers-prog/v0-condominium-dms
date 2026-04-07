-- 106-create-sample-expenses.sql
-- CREAR 4 GASTOS DE EJEMPLO

INSERT INTO public.condo_expenses (
  condo_id,
  title,
  amount,
  description,
  expense_date,
  period_month,
  period_year,
  created_at
)
SELECT
  (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1),
  title,
  amount,
  description,
  expense_date,
  period_month,
  period_year,
  NOW()
FROM (VALUES
  ('Servicios Básicos', 150000, 'Pago servicios básicos Abril', '2026-04-05'::date, 4, 2026),
  ('Mantenimiento', 200000, 'Mantenimiento preventivo', '2026-04-03'::date, 4, 2026),
  ('Reparación', 50000, 'Reparación bomba agua', '2026-04-01'::date, 4, 2026),
  ('Limpieza', 75000, 'Limpieza áreas comunes', '2026-04-07'::date, 4, 2026)
) AS t(title, amount, description, expense_date, period_month, period_year);

-- Verificar que los gastos fueron creados
SELECT 'GASTOS CREADOS' as status;
SELECT id, title, amount, description, expense_date, period_month, period_year FROM public.condo_expenses WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test') ORDER BY expense_date DESC;
