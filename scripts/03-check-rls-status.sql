-- CHECK IF RLS IS ENABLED ON PROFILES TABLE
SELECT 
  t.tablename,
  t.rowsecurity as "RLS Enabled",
  COUNT(p.policyname) as "Number of Policies"
FROM information_schema.tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename
WHERE t.tablename = 'profiles'
GROUP BY t.tablename, t.rowsecurity;
