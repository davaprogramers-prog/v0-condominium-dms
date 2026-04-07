-- LIMPIAR BASE DE DATOS COMPLETAMENTE
-- Ejecutar en orden para respetar foreign keys
-- Basado en el schema real de las tablas creadas

-- 1. Borrar payment_receipts (depende de incomes, houses, condominiums)
DELETE FROM public.payment_receipts;

-- 2. Borrar incomes (depende de income_types, houses, condominiums)
DELETE FROM public.incomes;

-- 3. Borrar income_types (depende de condominiums)
DELETE FROM public.income_types;

-- 4. Borrar parameters (depende de condominiums)
DELETE FROM public.parameters;

-- 5. Borrar houses (depende de condominiums)
DELETE FROM public.houses;

-- 6. Borrar condominiums
DELETE FROM public.condominiums;

-- 7. Borrar profiles (vinculados a auth.users pero no eliminamos usuarios auth)
DELETE FROM public.profiles;

-- Verificar que está limpio
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.condominiums) as condominiums_count,
  (SELECT COUNT(*) FROM public.houses) as houses_count,
  (SELECT COUNT(*) FROM public.income_types) as income_types_count,
  (SELECT COUNT(*) FROM public.incomes) as incomes_count,
  (SELECT COUNT(*) FROM public.payment_receipts) as payment_receipts_count,
  (SELECT COUNT(*) FROM public.parameters) as parameters_count;
