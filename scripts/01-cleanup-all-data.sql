-- 01-cleanup-all-data.sql
-- Borra TODOS los datos manteniendo la estructura de tablas
-- Ejecutar primero

-- Borrar en orden respetando foreign keys (más dependientes primero)
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
DELETE FROM public.house_expenses;
DELETE FROM public.variable_income;
DELETE FROM public.expenses;
DELETE FROM public.payments;
DELETE FROM public.rentals;
DELETE FROM public.condo_monthly_balance;
DELETE FROM public.condo_income;
DELETE FROM public.condo_expenses;
DELETE FROM public.projects;
DELETE FROM public.surveys;
DELETE FROM public.document_types;
DELETE FROM public.expense_logos;
DELETE FROM public.exemption_types;
DELETE FROM public.expense_types;
DELETE FROM public.parameters;
DELETE FROM public.site_settings;
DELETE FROM public.common_areas;
DELETE FROM public.houses;
DELETE FROM public.condominiums;
DELETE FROM public.profiles;

-- Verificar que está completamente limpio
SELECT 
  'profiles' as tabla, COUNT(*) as registros FROM public.profiles
UNION ALL
SELECT 'condominiums', COUNT(*) FROM public.condominiums
UNION ALL
SELECT 'houses', COUNT(*) FROM public.houses
ORDER BY tabla;
