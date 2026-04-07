-- CHECK RLS POLICIES ON PROFILES TABLE
-- Ver si hay políticas bloqueando el acceso

SELECT tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- También verificar si RLS está habilitado en la tabla
SELECT 
  schemaname,
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_class
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE tablename = 'profiles';
