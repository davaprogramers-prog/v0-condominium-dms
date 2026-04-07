-- Ver estructura exacta de las tablas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'condominiums', 'houses')
ORDER BY table_name, ordinal_position;
