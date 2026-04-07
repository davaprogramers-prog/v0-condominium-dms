-- LIMPIAR BASE DE DATOS COMPLETAMENTE
-- Ejecutar en orden para respetar foreign keys

-- 1. Borrar encuestas (hijas de houses)
DELETE FROM public.surveys;

-- 2. Borrar pagos (hijos de houses/condominiums)
DELETE FROM public.payments;

-- 3. Borrar gastos (hijos de houses/condominiums)
DELETE FROM public.expenses;

-- 4. Borrar ingresos (hijos de houses/condominiums)
DELETE FROM public.income;

-- 5. Borrar común areas (hijas de condominiums)
DELETE FROM public.common_areas;

-- 6. Borrar tipos de gastos/exoneraciones (hijas de condominiums)
DELETE FROM public.expense_types;
DELETE FROM public.exoneration_types;

-- 7. Borrar casas (hijas de condominiums)
DELETE FROM public.houses;

-- 8. Borrar condominiums
DELETE FROM public.condominiums;

-- 9. Borrar profiles (vinculados a auth.users)
DELETE FROM public.profiles;

-- 10. Borrar usuarios de auth (CUIDADO - esto borra la autenticación)
-- Opcionalmente descomentar si quieres limpiar usuarios auth también
-- DELETE FROM auth.users WHERE email LIKE '%@%';

-- Verificar que está limpio
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.condominiums) as condominiums_count,
  (SELECT COUNT(*) FROM public.houses) as houses_count,
  (SELECT COUNT(*) FROM public.income) as income_count,
  (SELECT COUNT(*) FROM public.expenses) as expenses_count,
  (SELECT COUNT(*) FROM public.payments) as payments_count;
