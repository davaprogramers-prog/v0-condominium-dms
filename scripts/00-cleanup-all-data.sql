-- LIMPIAR BASE DE DATOS COMPLETAMENTE
-- Ejecutar en orden para respetar foreign keys
-- Basado en el schema real de las tablas creadas

-- 1. Borrar payment_proofs (depende de payments)
DELETE FROM public.payment_proofs;

-- 2. Borrar payments (depende de houses, condominiums)
DELETE FROM public.payments;

-- 3. Borrar incomes (depende de income_types, houses, condominiums)
DELETE FROM public.incomes;

-- 4. Borrar income_types (depende de condominiums)
DELETE FROM public.income_types;

-- 5. Borrar parameters (depende de condominiums)
DELETE FROM public.parameters;

-- 6. Borrar houses (depende de condominiums)
DELETE FROM public.houses;

-- 7. Borrar condominiums
DELETE FROM public.condominiums;

-- 8. Borrar profiles (vinculados a auth.users pero no eliminamos usuarios auth)
DELETE FROM public.profiles;

-- Verificar que está limpio
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.condominiums) as condominiums_count,
  (SELECT COUNT(*) FROM public.houses) as houses_count,
  (SELECT COUNT(*) FROM public.income_types) as income_types_count,
  (SELECT COUNT(*) FROM public.incomes) as incomes_count,
  (SELECT COUNT(*) FROM public.payments) as payments_count,
  (SELECT COUNT(*) FROM public.payment_proofs) as payment_proofs_count,
  (SELECT COUNT(*) FROM public.parameters) as parameters_count;
