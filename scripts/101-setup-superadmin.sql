-- 101-setup-superadmin.sql
-- SETUP INICIAL: CREAR SUPER_ADMIN + 1 CONDOMINIO DE PRUEBA

INSERT INTO public.profiles (id, email, first_name, last_name, role, condo_id, house_id, avatar_url, created_at) 
VALUES (
  '757c0357-9af5-4c41-ba86-ebb230f4250a',
  'davaprogramers@gmail.com',
  'Holger',
  'Mora',
  'super_admin',
  NULL,
  NULL,
  NULL,
  NOW()
) ON CONFLICT (id) DO UPDATE SET role = 'super_admin', condo_id = NULL;

-- Crear un condominio de prueba
INSERT INTO public.condominiums (name, address, city, province, country, postal_code, phone, email, created_by, created_at, logo_url) 
VALUES (
  'Condominio Test',
  'Calle Test 123',
  'Santiago',
  'Metropolitana',
  'Chile',
  '8320000',
  '+56912345678',
  'info@test.cl',
  '757c0357-9af5-4c41-ba86-ebb230f4250a',
  NOW(),
  NULL
);

-- Verificar que el setup está correcto
SELECT 'SETUP COMPLETADO' as status;
SELECT id, email, role, condo_id FROM public.profiles WHERE email = 'davaprogramers@gmail.com';
SELECT id, name, created_by FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1;
