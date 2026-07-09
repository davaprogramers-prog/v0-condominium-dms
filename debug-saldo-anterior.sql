-- Debug script para verificar cálculo de Saldo Anterior para Abril 2026
-- Ejecuta esto en Supabase SQL editor

-- 1. Obtener Saldo Inicial del parámetro
SELECT id, saldo_inicial, fecha_inicio 
FROM condo_parameters 
LIMIT 1;

-- 2. Contar y sumar TODOS los ingresos hasta 31 de Marzo 2026
SELECT 
  COUNT(*) as total_registros,
  SUM(amount) as total_ingresos,
  status,
  income_type
FROM condo_income 
WHERE condo_id = (SELECT id FROM condos LIMIT 1)
  AND status = 'approved'
  AND income_date <= '2026-03-31'
GROUP BY status, income_type;

-- 3. Contar y sumar TODOS los gastos hasta 31 de Marzo 2026
SELECT 
  COUNT(*) as total_registros,
  SUM(amount) as total_gastos
FROM condo_expenses 
WHERE condo_id = (SELECT id FROM condos LIMIT 1)
  AND expense_date <= '2026-03-31';

-- 4. Cálculo manual del Saldo Anterior de Abril
WITH inicial AS (
  SELECT saldo_inicial FROM condo_parameters LIMIT 1
),
ingresos_marzo AS (
  SELECT COALESCE(SUM(amount), 0) as total 
  FROM condo_income 
  WHERE condo_id = (SELECT id FROM condos LIMIT 1)
    AND status = 'approved'
    AND income_date <= '2026-03-31'
),
gastos_marzo AS (
  SELECT COALESCE(SUM(amount), 0) as total 
  FROM condo_expenses 
  WHERE condo_id = (SELECT id FROM condos LIMIT 1)
    AND expense_date <= '2026-03-31'
)
SELECT 
  i.saldo_inicial as saldo_inicial,
  ing.total as ingresos_hasta_marzo,
  gast.total as gastos_hasta_marzo,
  i.saldo_inicial + ing.total - gast.total as saldo_anterior_abril_calculado
FROM inicial i
CROSS JOIN ingresos_marzo ing
CROSS JOIN gastos_marzo gast;

-- 5. Verificar datos de Abril específicamente
SELECT 
  COUNT(*) as registros_abril,
  SUM(amount) as total_ingresos_abril,
  income_type,
  status
FROM condo_income 
WHERE condo_id = (SELECT id FROM condos LIMIT 1)
  AND status = 'approved'
  AND income_date >= '2026-04-01'
  AND income_date <= '2026-04-30'
GROUP BY income_type, status;
