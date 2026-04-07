-- SCRIPT PARA EXTRAER TODA LA ESTRUCTURA DE SUPABASE
-- Ejecutar en Supabase SQL Editor y copiar el resultado

-- 1. TODAS LAS TABLAS EN PUBLIC SCHEMA
SELECT 
  'TABLAS EN PUBLIC' as tipo,
  table_name as nombre,
  NULL as columnas
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. TODAS LAS COLUMNAS DE CADA TABLA EN PUBLIC
SELECT 
  'COLUMNAS' as tipo,
  table_name,
  STRING_AGG(column_name || ' (' || data_type || ')', ', ') as columnas
FROM information_schema.columns 
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- 3. FOREIGN KEYS (DEPENDENCIAS ENTRE TABLAS)
SELECT 
  'FOREIGN KEYS' as tipo,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
