-- 106-create-sample-expenses.sql
-- CREAR 4 GASTOS DE EJEMPLO

INSERT INTO public.condo_expenses (
  condo_id,
  title,
  amount,
  description,
  created_at
)
SELECT
  (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1),
  title,
  amount,
  description,
  NOW()
FROM (VALUES
  ('Servicios Básicos', 150000, 'Pago servicios básicos Abril'),
  ('Mantenimiento', 200000, 'Mantenimiento preventivo'),
  ('Reparación', 50000, 'Reparación bomba agua'),
  ('Limpieza', 75000, 'Limpieza áreas comunes')
) AS t(title, amount, description);

-- Verificar que los gastos fueron creados
SELECT 'GASTOS CREADOS' as status;
SELECT id, title, amount, description, created_at FROM public.condo_expenses WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test') ORDER BY created_at DESC;
