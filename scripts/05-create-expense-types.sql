-- Script 05: Crear tipos de gastos estándar para el condominio
-- Estos serán los tipos de gasto que se pueden usar

DO $$
DECLARE
  v_condo_id UUID;
BEGIN
  SELECT id INTO v_condo_id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1;

  -- Gasto: Mantenimiento Común
  INSERT INTO public.expense_types (
    name,
    description,
    condo_id,
    is_fixed
  ) VALUES (
    'Mantenimiento Común',
    'Mantenimiento de áreas comunes y servicios generales',
    v_condo_id,
    true
  ) ON CONFLICT DO NOTHING;

  -- Gasto: Servicios (Agua, Luz, Gas)
  INSERT INTO public.expense_types (
    name,
    description,
    condo_id,
    is_fixed
  ) VALUES (
    'Servicios',
    'Agua, electricidad, gas y telefonía',
    v_condo_id,
    true
  ) ON CONFLICT DO NOTHING;

  -- Gasto: Seguridad
  INSERT INTO public.expense_types (
    name,
    description,
    condo_id,
    is_fixed
  ) VALUES (
    'Seguridad',
    'Personal de seguridad y monitoreo',
    v_condo_id,
    true
  ) ON CONFLICT DO NOTHING;

  -- Gasto: Limpieza
  INSERT INTO public.expense_types (
    name,
    description,
    condo_id,
    is_fixed
  ) VALUES (
    'Limpieza',
    'Limpieza de áreas comunes',
    v_condo_id,
    true
  ) ON CONFLICT DO NOTHING;

  -- Gasto: Reparaciones (Variable)
  INSERT INTO public.expense_types (
    name,
    description,
    condo_id,
    is_fixed
  ) VALUES (
    'Reparaciones',
    'Reparaciones y mantenimiento correctivo',
    v_condo_id,
    false
  ) ON CONFLICT DO NOTHING;

END $$;

-- Verificar que se crearon
SELECT name, description, is_fixed FROM public.expense_types WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1) ORDER BY name;
