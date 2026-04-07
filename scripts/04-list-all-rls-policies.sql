-- LIST ALL RLS POLICIES ON PROFILES TABLE
SELECT 
  policyname,
  permissive,
  roles::text,
  qual as "CONDITION",
  with_check as "WITH_CHECK"
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
