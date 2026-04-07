-- SETUP INICIAL: CREAR SUPER_ADMIN + 1 CONDOMINIO DE PRUEBA
-- Este script asume que ya existe el usuario davaprogramers@gmail.com en auth.users

-- 1. Insertar perfil de super_admin
-- El ID debe coincidir con el usuario en auth.users (757c0357-9af5-4c41-ba86-ebb230f4250a)
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  condo_id,
  house_id,
  avatar_url,
  created_at,
  updated_at
) VALUES (
  '757c0357-9af5-4c41-ba86-ebb230f4250a',
  'davaprogramers@gmail.com',
  'Holger',
  'Mora',
  'super_admin',
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  condo_id = NULL,
  updated_at = NOW();

-- 2. Crear un condominio de prueba
INSERT INTO public.condominiums (
  name,
  description,
  address,
  city,
  province,
  country,
  postal_code,
  phone,
  email,
  created_by,
  created_at,
  updated_at,
  logo_url
) VALUES (
  'Condominio Test',
  'Condominio de prueba para testing del sistema',
  'Calle Test 123',
  'Santiago',
  'Metropolitana',
  'Chile',
  '8320000',
  '+56912345678',
  'info@test.cl',
  '757c0357-9af5-4c41-ba86-ebb230f4250a',
  NOW(),
  NOW(),
  NULL
);

-- 3. Verificar que el setup está correcto
SELECT 'PERFILES' as tipo, COUNT(*) as cantidad FROM public.profiles
UNION ALL
SELECT 'CONDOMINIOS', COUNT(*) FROM public.condominiums;

SELECT 'Profile creado:' as info;
SELECT id, email, role, condo_id FROM public.profiles WHERE email = 'davaprogramers@gmail.com';

SELECT 'Condominio creado:' as info;
SELECT id, name, created_by FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1;
