-- Enable RLS on all tables that have policies but RLS is disabled
-- This fixes the "Policy Exists RLS Disabled" errors

-- Core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

-- Financial tables
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condo_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condo_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_expenses ENABLE ROW LEVEL SECURITY;

-- Exemptions
ALTER TABLE public.exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exemption_types ENABLE ROW LEVEL SECURITY;

-- Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_quotes ENABLE ROW LEVEL SECURITY;

-- Other features
ALTER TABLE public.infractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.common_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_condominiums ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled (for logging purposes)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
