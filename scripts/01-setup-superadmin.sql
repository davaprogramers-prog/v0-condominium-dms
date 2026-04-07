-- SETUP INICIAL - SUPER ADMIN + 1 CONDOMINIO BÁSICO

-- 1. Insertar profile para super_admin (el usuario davaprogramers@gmail.com ya existe en auth.users)
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
  condo_id = NULL;

-- 2. Crear 1 condominio básico
INSERT INTO public.condominiums (
  name,
  address,
  city,
  country,
  created_by,
  created_at,
  updated_at
) VALUES (
  'Condominio Test',
  'Calle Principal 123',
  'Santiago',
  'Chile',
  '757c0357-9af5-4c41-ba86-ebb230f4250a',
  NOW(),
  NOW()
) RETURNING id;

-- Verificar setup
SELECT 
  p.id, p.email, p.role, p.condo_id,
  c.id as condo_id, c.name as condo_name
FROM public.profiles p
LEFT JOIN public.condominiums c ON c.created_by = p.id
WHERE p.email = 'davaprogramers@gmail.com';
