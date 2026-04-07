-- Script 07: Crear ingresos de ejemplo para Abril 2026
-- Ingresos de pagos de mantenimiento de las casas

DO $$
DECLARE
  v_condo_id UUID;
  v_house_id UUID;
BEGIN
  SELECT id INTO v_condo_id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1;

  -- Ingreso de Casa #101
  SELECT id INTO v_house_id FROM public.houses WHERE condo_id = v_condo_id AND number = '101' LIMIT 1;
  
  INSERT INTO public.incomes (
    description,
    amount,
    income_type,
    house_id,
    condo_id,
    income_date
  ) VALUES (
    'Cuota mantenimiento Casa 101 - Abril',
    150000,
    'Cuota Mantenimiento',
    v_house_id,
    v_condo_id,
    '2026-04-02'
  ) ON CONFLICT DO NOTHING;

  -- Ingreso de Casa #102
  SELECT id INTO v_house_id FROM public.houses WHERE condo_id = v_condo_id AND number = '102' LIMIT 1;
  
  INSERT INTO public.incomes (
    description,
    amount,
    income_type,
    house_id,
    condo_id,
    income_date
  ) VALUES (
    'Cuota mantenimiento Casa 102 - Abril',
    150000,
    'Cuota Mantenimiento',
    v_house_id,
    v_condo_id,
    '2026-04-02'
  ) ON CONFLICT DO NOTHING;

  -- Ingreso de Casa #103
  SELECT id INTO v_house_id FROM public.houses WHERE condo_id = v_condo_id AND number = '103' LIMIT 1;
  
  INSERT INTO public.incomes (
    description,
    amount,
    income_type,
    house_id,
    condo_id,
    income_date
  ) VALUES (
    'Cuota mantenimiento Casa 103 - Abril',
    150000,
    'Cuota Mantenimiento',
    v_house_id,
    v_condo_id,
    '2026-04-03'
  ) ON CONFLICT DO NOTHING;

  -- Ingreso de Casa #201
  SELECT id INTO v_house_id FROM public.houses WHERE condo_id = v_condo_id AND number = '201' LIMIT 1;
  
  INSERT INTO public.incomes (
    description,
    amount,
    income_type,
    house_id,
    condo_id,
    income_date
  ) VALUES (
    'Cuota mantenimiento Casa 201 - Abril',
    150000,
    'Cuota Mantenimiento',
    v_house_id,
    v_condo_id,
    '2026-04-04'
  ) ON CONFLICT DO NOTHING;

  -- Ingreso de Casa #202
  SELECT id INTO v_house_id FROM public.houses WHERE condo_id = v_condo_id AND number = '202' LIMIT 1;
  
  INSERT INTO public.incomes (
    description,
    amount,
    income_type,
    house_id,
    condo_id,
    income_date
  ) VALUES (
    'Cuota mantenimiento Casa 202 - Abril',
    150000,
    'Cuota Mantenimiento',
    v_house_id,
    v_condo_id,
    '2026-04-04'
  ) ON CONFLICT DO NOTHING;

END $$;

-- Verificar que se crearon
SELECT description, amount, income_type, income_date FROM public.incomes 
WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1)
ORDER BY income_date;
