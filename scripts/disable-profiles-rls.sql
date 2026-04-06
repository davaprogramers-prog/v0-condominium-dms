-- Desabilitar RLS en tabla profiles temporalmente para diagnosticar
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verificar estado
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
