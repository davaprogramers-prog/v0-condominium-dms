-- Script 03: Crear un usuario ADMIN para el Condominio Test
-- Este usuario podrá gestionar el condominio

-- Nota: Primero necesitas crear el usuario en Supabase Auth
-- Por ahora, creamos el profile para un admin ficticio
-- (En producción, este usuario sería creado por el super_admin en la UI)

-- Insertar profile de admin del condominio
-- ID: Carlos Adaros (será administrador)
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  condo_id,
  house_id
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'carlos.admin@test.cl',
  'Carlos',
  'Adaros',
  'admin',
  (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1),
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Verificar que se creó
SELECT id, email, role, condo_id FROM public.profiles WHERE email = 'carlos.admin@test.cl';
