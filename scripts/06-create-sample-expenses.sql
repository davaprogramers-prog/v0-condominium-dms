-- Script 06: Crear gastos de ejemplo para Abril 2026

DO $$
DECLARE
  v_condo_id UUID;
  v_expense_type_id UUID;
BEGIN
  SELECT id INTO v_condo_id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1;
  
  -- Obtener los tipos de gasto creados
  SELECT id INTO v_expense_type_id FROM public.expense_types 
    WHERE condo_id = v_condo_id AND name = 'Mantenimiento Común' LIMIT 1;

  -- Gasto 1: Mantenimiento - $50,000
  INSERT INTO public.expenses (
    description,
    amount,
    category,
    expense_type_id,
    condo_id,
    expense_date
  ) VALUES (
    'Reparación de pintura en pasillos',
    50000,
    'Mantenimiento Común',
    v_expense_type_id,
    v_condo_id,
    '2026-04-05'
  ) ON CONFLICT DO NOTHING;

  -- Gasto 2: Servicios - $120,000
  SELECT id INTO v_expense_type_id FROM public.expense_types 
    WHERE condo_id = v_condo_id AND name = 'Servicios' LIMIT 1;

  INSERT INTO public.expenses (
    description,
    amount,
    category,
    expense_type_id,
    condo_id,
    expense_date
  ) VALUES (
    'Factura agua y electricidad - Abril',
    120000,
    'Servicios',
    v_expense_type_id,
    v_condo_id,
    '2026-04-01'
  ) ON CONFLICT DO NOTHING;

  -- Gasto 3: Seguridad - $80,000
  SELECT id INTO v_expense_type_id FROM public.expense_types 
    WHERE condo_id = v_condo_id AND name = 'Seguridad' LIMIT 1;

  INSERT INTO public.expenses (
    description,
    amount,
    category,
    expense_type_id,
    condo_id,
    expense_date
  ) VALUES (
    'Pago seguridad - Abril',
    80000,
    'Seguridad',
    v_expense_type_id,
    v_condo_id,
    '2026-04-01'
  ) ON CONFLICT DO NOTHING;

  -- Gasto 4: Limpieza - $40,000
  SELECT id INTO v_expense_type_id FROM public.expense_types 
    WHERE condo_id = v_condo_id AND name = 'Limpieza' LIMIT 1;

  INSERT INTO public.expenses (
    description,
    amount,
    category,
    expense_type_id,
    condo_id,
    expense_date
  ) VALUES (
    'Servicio limpieza áreas comunes',
    40000,
    'Limpieza',
    v_expense_type_id,
    v_condo_id,
    '2026-04-03'
  ) ON CONFLICT DO NOTHING;

END $$;

-- Verificar que se crearon
SELECT description, amount, category, expense_date FROM public.expenses 
WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1)
ORDER BY expense_date;
