-- 102-disable-rls-profiles.sql
-- DESHABILITAR RLS EN PROFILES TABLE
-- Necesario porque las políticas RLS existentes están causando conflictos

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT tablename, COUNT(policyname) as "Number of Policies"
FROM pg_policies
WHERE tablename = 'profiles'
GROUP BY tablename;

SELECT 'RLS Disabled on profiles table' as status;
