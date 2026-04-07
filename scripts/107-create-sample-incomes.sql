-- 107-create-sample-incomes.sql
-- CREAR 5 INGRESOS (CUOTAS DE MANTENIMIENTO) DE EJEMPLO

WITH condo AS (
  SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1
),
houses_list AS (
  SELECT id FROM public.houses 
  WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test')
)
INSERT INTO public.condo_income (
  condo_id,
  amount,
  description,
  date,
  created_at
)
SELECT
  condo.id,
  300000,
  'Cuota mantenimiento Abril - Casa ' || ROW_NUMBER() OVER (ORDER BY h.id),
  '2026-04-07'::date,
  NOW()
FROM condo, houses_list h;

-- Verificar que los ingresos fueron creados
SELECT 'INGRESOS CREADOS' as status;
SELECT id, amount, description, date FROM public.condo_income WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test') ORDER BY date DESC;
