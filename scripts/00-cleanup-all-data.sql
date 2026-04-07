-- LIMPIAR BASE DE DATOS COMPLETAMENTE
-- Ejecutar en orden para respetar foreign keys
-- Basado en schema extraído de Supabase el 2026-04-07

-- 1. Tablas dependientes (más profundas)
DELETE FROM public.payment_proofs;
DELETE FROM public.project_quotes;
DELETE FROM public.survey_votes;
DELETE FROM public.survey_options;
DELETE FROM public.notifications;
DELETE FROM public.infractions;
DELETE FROM public.exemptions;
DELETE FROM public.supply_requests;
DELETE FROM public.concierge_worklogs;
DELETE FROM public.documents;
DELETE FROM public.bank_statements;
DELETE FROM public.alerts;

-- 2. Tablas de ingresos/gastos por casa
DELETE FROM public.house_expenses;
DELETE FROM public.variable_income;
DELETE FROM public.expenses;
DELETE FROM public.payments;
DELETE FROM public.rentals;

-- 3. Tablas de finanzas del condominio
DELETE FROM public.condo_monthly_balance;
DELETE FROM public.condo_income;
DELETE FROM public.condo_expenses;

-- 4. Tablas de proyectos
DELETE FROM public.projects;

-- 5. Tablas de encuestas
DELETE FROM public.surveys;

-- 6. Tablas de recursos (tipos, logos, etc)
DELETE FROM public.document_types;
DELETE FROM public.expense_logos;
DELETE FROM public.exemption_types;
DELETE FROM public.expense_types;
DELETE FROM public.parameters;

-- 7. Tablas de configuración
DELETE FROM public.site_settings;

-- 8. Tablas base (casas y áreas comunes)
DELETE FROM public.common_areas;
DELETE FROM public.houses;

-- 9. Tabla base de condominios
DELETE FROM public.condominiums;

-- 10. Tabla de perfiles (vinculada a auth.users pero no la borramos)
DELETE FROM public.profiles;

-- Verificar que está limpio
SELECT 
  'profiles' as tabla, COUNT(*) as registros FROM public.profiles
UNION ALL
SELECT 'condominiums', COUNT(*) FROM public.condominiums
UNION ALL
SELECT 'houses', COUNT(*) FROM public.houses
UNION ALL
SELECT 'expenses', COUNT(*) FROM public.expenses
UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL
SELECT 'condo_income', COUNT(*) FROM public.condo_income
UNION ALL
SELECT 'condo_expenses', COUNT(*) FROM public.condo_expenses
UNION ALL
SELECT 'surveys', COUNT(*) FROM public.surveys
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects
ORDER BY tabla;
