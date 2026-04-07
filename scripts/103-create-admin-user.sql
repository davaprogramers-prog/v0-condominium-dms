-- 103-create-admin-user.sql
-- CREAR UN ADMIN PARA EL CONDOMINIO TEST
-- Este admin puede gestionar el condominio desde el dashboard

-- Primero, obtener el ID del condominio
WITH condo AS (
  SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1
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
  'admin@condominiotest.cl',
  'Carlos',
  'Administrador',
  'admin',
  condo.id,
  NULL,
  NULL,
  NOW()
FROM condo;

-- Verificar que el admin fue creado
SELECT 'ADMIN CREADO' as status;
SELECT id, email, role, condo_id FROM public.profiles WHERE email = 'admin@condominiotest.cl';
