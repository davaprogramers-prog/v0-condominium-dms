-- 103-create-admin-user.sql
-- CREAR UN ADMIN PARA EL CONDOMINIO TEST

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
) VALUES (
  gen_random_uuid(),
  'admin@condominiotest.cl',
  'Carlos',
  'Administrador',
  'admin',
  (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1),
  NULL,
  NULL,
  NOW()
);

-- Verificar que el admin fue creado
SELECT 'ADMIN CREADO' as resultado;
SELECT id, email, role, condo_id FROM public.profiles WHERE email = 'admin@condominiotest.cl';
