-- 105-create-expense-types.sql
-- CREAR TIPOS DE GASTOS PARA EL CONDOMINIO

WITH condo AS (
  SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1
)
INSERT INTO public.expense_types (
  condo_id,
  name,
  description,
  created_at
)
SELECT
  condo.id,
  name,
  description,
  NOW()
FROM condo,
(VALUES
  ('Mantenimiento General', 'Mantenimiento de áreas comunes'),
  ('Servicios Básicos', 'Agua, luz, internet'),
  ('Limpieza', 'Limpieza de áreas comunes'),
  ('Seguridad', 'Servicios de seguridad y vigilancia'),
  ('Reparaciones', 'Reparaciones extraordinarias'),
  ('Seguros', 'Seguros del edificio')
) AS t(name, description);

-- Verificar que los tipos de gastos fueron creados
SELECT 'TIPOS DE GASTOS CREADOS' as status;
SELECT id, name, condo_id FROM public.expense_types WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test');
