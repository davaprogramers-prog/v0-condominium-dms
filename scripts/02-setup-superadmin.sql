-- 02-setup-superadmin.sql
-- Crea super_admin + 1 condominio de prueba
-- Ejecutar DESPUÉS de 01-cleanup-all-data.sql

-- 1. Insertar perfil de super_admin
-- El ID debe coincidir con el usuario en auth.users (davaprogramers@gmail.com)
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  condo_id,
  house_id,
  avatar_url,
  phone,
  created_at
) VALUES (
  '757c0357-9af5-4c41-ba86-ebb230f4250a',
  'davaprogramers@gmail.com',
  'Holger',
  'Mora',
  'super_admin',
  NULL,
  NULL,
  NULL,
  NULL,
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  condo_id = NULL,
  created_at = NOW();

-- 2. Crear 1 condominio de prueba
INSERT INTO public.condominiums (
  name,
  address,
  currency,
  currency_symbol,
  currency_multiplier,
  total_houses,
  common_expense_amount,
  cards_public,
  payment_deadline_day,
  created_by,
  created_at,
  logo_url
) VALUES (
  'Condominio Test',
  'Calle Test 123',
  'CLP',
  '$',
  1,
  1,
  0,
  false,
  10,
  '757c0357-9af5-4c41-ba86-ebb230f4250a',
  NOW(),
  NULL
);

-- 3. Verificar que el setup está correcto
SELECT '=== SETUP COMPLETADO ===' as info;

SELECT '--- PERFILES ---' as info;
SELECT id, email, role, condo_id FROM public.profiles;

SELECT '--- CONDOMINIOS ---' as info;
SELECT id, name, created_by FROM public.condominiums;
