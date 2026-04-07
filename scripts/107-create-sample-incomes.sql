-- 107-create-sample-incomes.sql
-- CREAR 5 INGRESOS (CUOTAS DE MANTENIMIENTO) DE EJEMPLO

INSERT INTO public.condo_income (
  condo_id,
  amount,
  description,
  income_date,
  period_month,
  period_year,
  created_at
)
SELECT
  (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1),
  amount,
  description,
  income_date,
  period_month,
  period_year,
  NOW()
FROM (VALUES
  (300000, 'Cuota mantenimiento Abril - Casa 101', '2026-04-07'::date, 4, 2026),
  (300000, 'Cuota mantenimiento Abril - Casa 102', '2026-04-07'::date, 4, 2026),
  (300000, 'Cuota mantenimiento Abril - Casa 103', '2026-04-07'::date, 4, 2026),
  (300000, 'Cuota mantenimiento Abril - Casa 104', '2026-04-07'::date, 4, 2026),
  (300000, 'Cuota mantenimiento Abril - Casa 105', '2026-04-07'::date, 4, 2026)
) AS t(amount, description, income_date, period_month, period_year);

-- Verificar que los ingresos fueron creados
SELECT 'INGRESOS CREADOS' as status;
SELECT id, amount, description, income_date, period_month, period_year FROM public.condo_income WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test') ORDER BY income_date DESC;
