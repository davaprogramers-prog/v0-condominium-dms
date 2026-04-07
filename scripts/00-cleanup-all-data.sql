-- LIMPIAR BASE DE DATOS COMPLETAMENTE
-- Ejecutar en orden para respetar foreign keys

-- 1. Borrar encuestas (hijas de houses)
DELETE FROM public.surveys;

-- 2. Borrar pagos (hijos de houses/condominiums)
DELETE FROM public.payments;

-- 3. Borrar gastos e ingresos (hijos de houses/condominiums)
DELETE FROM public.expenses;

-- 4. Borrar común areas (hijas de condominiums)
DELETE FROM public.common_areas;

-- 5. Borrar tipos de gastos/exoneraciones (hijas de condominiums)
DELETE FROM public.expense_types;
DELETE FROM public.exoneration_types;

-- 6. Borrar casas (hijas de condominiums)
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
  (SELECT COUNT(*) FROM public.expenses) as expenses_count,
  (SELECT COUNT(*) FROM public.payments) as payments_count;
