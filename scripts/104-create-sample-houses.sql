-- 104-create-sample-houses.sql
-- CREAR 5 CASAS CON PROPIETARIOS

WITH condo AS (
  SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1
)
INSERT INTO public.houses (
  condo_id,
  number,
  owner_name,
  owner_email,
  owner_phone,
  created_at
)
SELECT
  condo.id,
  num,
  owner,
  email,
  phone,
  NOW()
FROM condo,
(VALUES
  (101, 'Juan Pérez', 'juan@email.com', '+56912345001'),
  (102, 'María García', 'maria@email.com', '+56912345002'),
  (103, 'Roberto López', 'roberto@email.com', '+56912345003'),
  (104, 'Sandra Martínez', 'sandra@email.com', '+56912345004'),
  (105, 'Luis Rodríguez', 'luis@email.com', '+56912345005')
) AS t(num, owner, email, phone);

-- Crear profiles para los propietarios
WITH condo AS (
  SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1
),
houses_data AS (
  SELECT h.id, h.owner_name, h.owner_email, condo.id as condo_id
  FROM public.houses h, condo
  WHERE h.condo_id = condo.id
)
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  condo_id,
  house_id,
  avatar_url,
  created_at
)
SELECT
  gen_random_uuid(),
  hd.owner_email,
  SPLIT_PART(hd.owner_name, ' ', 1),
  SPLIT_PART(hd.owner_name, ' ', 2),
  'owner',
  hd.condo_id,
  hd.id,
  NULL,
  NOW()
FROM houses_data hd;

-- Verificar que las casas fueron creadas
SELECT 'CASAS CREADAS' as status;
SELECT id, number, owner_name, condo_id FROM public.houses WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test') ORDER BY number;
