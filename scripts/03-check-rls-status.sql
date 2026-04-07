-- CHECK IF RLS IS ENABLED ON PROFILES TABLE
SELECT 
  t.table_name,
  t.table_type,
  COUNT(p.policyname) as "Number of Policies"
FROM information_schema.tables t
LEFT JOIN pg_policies p ON p.tablename = t.table_name
WHERE t.table_name = 'profiles' AND t.table_schema = 'public'
GROUP BY t.table_name, t.table_type;
