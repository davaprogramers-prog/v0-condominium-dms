-- DESHABILITAR RLS EN LA TABLA PROFILES (SOLUCIÓN TEMPORAL)
-- Las políticas RLS actuales están causando error 500 porque usan funciones que fallan
-- Una vez que todo funcione, reinstalaremos RLS correctamente

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
  tablename,
  (SELECT 'RLS Disabled' WHERE NOT rowsecurity) as status
FROM pg_tables
WHERE tablename = 'profiles' AND schemaname = 'public';
