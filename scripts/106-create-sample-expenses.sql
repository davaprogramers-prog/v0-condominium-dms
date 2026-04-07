-- 106-create-sample-expenses.sql
-- CREAR 4 GASTOS DE EJEMPLO

INSERT INTO public.condo_expenses (
  condo_id,
  amount,
  description,
  date,
  created_at
)
SELECT
  (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1),
  amount,
  description,
  date,
  NOW()
FROM (VALUES
  (150000, 'Pago servicios básicos Abril', '2026-04-05'::date),
  (200000, 'Mantenimiento preventivo', '2026-04-03'::date),
  (50000, 'Reparación bomba agua', '2026-04-01'::date),
  (75000, 'Limpieza áreas comunes', '2026-04-07'::date)
) AS t(amount, description, date);

-- Verificar que los gastos fueron creados
SELECT 'GASTOS CREADOS' as status;
SELECT id, amount, description, date FROM public.condo_expenses WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test') ORDER BY date DESC;
