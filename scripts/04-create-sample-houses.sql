-- Script 04: Crear 5 casas de ejemplo en Condominio Test
-- Cada casa tendrá un propietario diferente

-- Obtener el ID del condominio
DO $$
DECLARE
  v_condo_id UUID;
BEGIN
  SELECT id INTO v_condo_id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1;

  -- Casa #1
  INSERT INTO public.houses (
    number,
    owner_name,
    owner_email,
    owner_phone,
    condo_id
  ) VALUES (
    '101',
    'Juan Pérez',
    'juan.perez@test.cl',
    '+56912345601',
    v_condo_id
  ) ON CONFLICT DO NOTHING;

  -- Casa #2
  INSERT INTO public.houses (
    number,
    owner_name,
    owner_email,
    owner_phone,
    condo_id
  ) VALUES (
    '102',
    'María García',
    'maria.garcia@test.cl',
    '+56912345602',
    v_condo_id
  ) ON CONFLICT DO NOTHING;

  -- Casa #3
  INSERT INTO public.houses (
    number,
    owner_name,
    owner_email,
    owner_phone,
    condo_id
  ) VALUES (
    '103',
    'Roberto López',
    'roberto.lopez@test.cl',
    '+56912345603',
    v_condo_id
  ) ON CONFLICT DO NOTHING;

  -- Casa #4
  INSERT INTO public.houses (
    number,
    owner_name,
    owner_email,
    owner_phone,
    condo_id
  ) VALUES (
    '201',
    'Ana Martínez',
    'ana.martinez@test.cl',
    '+56912345604',
    v_condo_id
  ) ON CONFLICT DO NOTHING;

  -- Casa #5
  INSERT INTO public.houses (
    number,
    owner_name,
    owner_email,
    owner_phone,
    condo_id
  ) VALUES (
    '202',
    'Francisco Silva',
    'francisco.silva@test.cl',
    '+56912345605',
    v_condo_id
  ) ON CONFLICT DO NOTHING;

END $$;

-- Verificar que se crearon
SELECT number, owner_name, owner_email FROM public.houses WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1) ORDER BY number;
