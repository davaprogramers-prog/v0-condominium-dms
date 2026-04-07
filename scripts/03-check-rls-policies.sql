-- CHECK RLS POLICIES ON PROFILES TABLE
-- Ver si hay políticas bloqueando el acceso

-- Ver todas las políticas en profiles
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Verificar que el perfil existe
SELECT id, email, role, condo_id FROM public.profiles WHERE email = 'davaprogramers@gmail.com';
