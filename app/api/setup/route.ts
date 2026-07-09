import { NextResponse } from "next/server"

const MIGRATION_SQL = `
-- =============================================
-- CondoAdmin Database Schema
-- =============================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  condo_id UUID,
  house_id UUID,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Condominiums
CREATE TABLE IF NOT EXISTS public.condominiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  total_houses INTEGER NOT NULL DEFAULT 1,
  currency TEXT NOT NULL DEFAULT 'CLP',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  currency_multiplier NUMERIC NOT NULL DEFAULT 1,
  common_expense_amount NUMERIC NOT NULL DEFAULT 0,
  payment_deadline_day INTEGER NOT NULL DEFAULT 5,
  cards_public BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "condo_select" ON public.condominiums;
CREATE POLICY "condo_select" ON public.condominiums FOR SELECT USING (true);
DROP POLICY IF EXISTS "condo_insert" ON public.condominiums;
CREATE POLICY "condo_insert" ON public.condominiums FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "condo_update" ON public.condominiums;
CREATE POLICY "condo_update" ON public.condominiums FOR UPDATE USING (created_by = auth.uid());
DROP POLICY IF EXISTS "condo_delete" ON public.condominiums;
CREATE POLICY "condo_delete" ON public.condominiums FOR DELETE USING (created_by = auth.uid());

-- 3. Houses
CREATE TABLE IF NOT EXISTS public.houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_number TEXT NOT NULL,
  owner_name TEXT,
  owner_email TEXT,
  owner_id UUID REFERENCES auth.users(id),
  avatar_url TEXT,
  payment_deadline_day INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(condo_id, house_number)
);
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "houses_select" ON public.houses;
CREATE POLICY "houses_select" ON public.houses FOR SELECT USING (true);
DROP POLICY IF EXISTS "houses_admin" ON public.houses;
CREATE POLICY "houses_admin" ON public.houses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = houses.condo_id AND c.created_by = auth.uid())
);

-- 4. Expense Types
CREATE TABLE IF NOT EXISTS public.expense_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expense_types_select" ON public.expense_types;
CREATE POLICY "expense_types_select" ON public.expense_types FOR SELECT USING (true);
DROP POLICY IF EXISTS "expense_types_admin" ON public.expense_types;
CREATE POLICY "expense_types_admin" ON public.expense_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = expense_types.condo_id AND c.created_by = auth.uid())
);

-- 5. Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  expense_type_id UUID REFERENCES public.expense_types(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_month INTEGER,
  period_year INTEGER,
  receipt_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT USING (true);
DROP POLICY IF EXISTS "expenses_admin" ON public.expenses;
CREATE POLICY "expenses_admin" ON public.expenses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = expenses.condo_id AND c.created_by = auth.uid())
);

-- 6. Payments (gasto comun de cada casa)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'transferencia',
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente','verificado','rechazado')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (true);
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "payments_update" ON public.payments;
CREATE POLICY "payments_update" ON public.payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = payments.condo_id AND c.created_by = auth.uid())
);

-- 7. Variable Income
CREATE TABLE IF NOT EXISTS public.variable_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.variable_income ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "variable_income_select" ON public.variable_income;
CREATE POLICY "variable_income_select" ON public.variable_income FOR SELECT USING (true);
DROP POLICY IF EXISTS "variable_income_admin" ON public.variable_income;
CREATE POLICY "variable_income_admin" ON public.variable_income FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = variable_income.condo_id AND c.created_by = auth.uid())
);

-- 8. Exemption Types
CREATE TABLE IF NOT EXISTS public.exemption_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.exemption_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exemption_types_select" ON public.exemption_types;
CREATE POLICY "exemption_types_select" ON public.exemption_types FOR SELECT USING (true);
DROP POLICY IF EXISTS "exemption_types_admin" ON public.exemption_types;
CREATE POLICY "exemption_types_admin" ON public.exemption_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = exemption_types.condo_id AND c.created_by = auth.uid())
);

-- 9. Exemptions
CREATE TABLE IF NOT EXISTS public.exemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  exemption_type_id UUID REFERENCES public.exemption_types(id),
  is_permanent BOOLEAN DEFAULT false,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  percentage NUMERIC DEFAULT 100,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.exemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exemptions_select" ON public.exemptions;
CREATE POLICY "exemptions_select" ON public.exemptions FOR SELECT USING (true);
DROP POLICY IF EXISTS "exemptions_admin" ON public.exemptions;
CREATE POLICY "exemptions_admin" ON public.exemptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = exemptions.condo_id AND c.created_by = auth.uid())
);

-- 10. Improvement Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  improvement_type TEXT,
  status TEXT DEFAULT 'propuesto' CHECK (status IN ('propuesto','aprobado','en_progreso','completado','cancelado')),
  location_description TEXT,
  location_photo_url TEXT,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "projects_admin" ON public.projects;
CREATE POLICY "projects_admin" ON public.projects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = projects.condo_id AND c.created_by = auth.uid())
);

-- 11. Project Quotes
CREATE TABLE IF NOT EXISTS public.project_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  document_url TEXT,
  selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.project_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_quotes_select" ON public.project_quotes;
CREATE POLICY "project_quotes_select" ON public.project_quotes FOR SELECT USING (true);
DROP POLICY IF EXISTS "project_quotes_admin" ON public.project_quotes;
CREATE POLICY "project_quotes_admin" ON public.project_quotes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p JOIN public.condominiums c ON c.id = p.condo_id WHERE p.id = project_quotes.project_id AND c.created_by = auth.uid())
);

-- 12. Surveys
CREATE TABLE IF NOT EXISTS public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  closes_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "surveys_select" ON public.surveys;
CREATE POLICY "surveys_select" ON public.surveys FOR SELECT USING (true);
DROP POLICY IF EXISTS "surveys_admin" ON public.surveys;
CREATE POLICY "surveys_admin" ON public.surveys FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = surveys.condo_id AND c.created_by = auth.uid())
);

-- 13. Survey Options
CREATE TABLE IF NOT EXISTS public.survey_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.survey_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "survey_options_select" ON public.survey_options;
CREATE POLICY "survey_options_select" ON public.survey_options FOR SELECT USING (true);
DROP POLICY IF EXISTS "survey_options_admin" ON public.survey_options;
CREATE POLICY "survey_options_admin" ON public.survey_options FOR ALL USING (
  EXISTS (SELECT 1 FROM public.surveys s JOIN public.condominiums c ON c.id = s.condo_id WHERE s.id = survey_options.survey_id AND c.created_by = auth.uid())
);

-- 14. Survey Votes
CREATE TABLE IF NOT EXISTS public.survey_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.survey_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, user_id)
);
ALTER TABLE public.survey_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "survey_votes_select" ON public.survey_votes;
CREATE POLICY "survey_votes_select" ON public.survey_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "survey_votes_insert" ON public.survey_votes;
CREATE POLICY "survey_votes_insert" ON public.survey_votes FOR INSERT WITH CHECK (user_id = auth.uid());

-- 15. Document Types
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "doc_types_select" ON public.document_types;
CREATE POLICY "doc_types_select" ON public.document_types FOR SELECT USING (true);
DROP POLICY IF EXISTS "doc_types_admin" ON public.document_types;
CREATE POLICY "doc_types_admin" ON public.document_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = document_types.condo_id AND c.created_by = auth.uid())
);

-- 16. Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES public.document_types(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents FOR SELECT USING (true);
DROP POLICY IF EXISTS "documents_admin" ON public.documents;
CREATE POLICY "documents_admin" ON public.documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = documents.condo_id AND c.created_by = auth.uid())
);

-- 17. Infractions
CREATE TABLE IF NOT EXISTS public.infractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  fine_amount NUMERIC DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  paid_receipt_url TEXT,
  infraction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.infractions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "infractions_select" ON public.infractions;
CREATE POLICY "infractions_select" ON public.infractions FOR SELECT USING (true);
DROP POLICY IF EXISTS "infractions_admin" ON public.infractions;
CREATE POLICY "infractions_admin" ON public.infractions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = infractions.condo_id AND c.created_by = auth.uid())
);

-- 18. Rentals
CREATE TABLE IF NOT EXISTS public.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  space_name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  rental_amount NUMERIC NOT NULL DEFAULT 0,
  tenant_name TEXT,
  tenant_contact TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rentals_select" ON public.rentals;
CREATE POLICY "rentals_select" ON public.rentals FOR SELECT USING (true);
DROP POLICY IF EXISTS "rentals_admin" ON public.rentals;
CREATE POLICY "rentals_admin" ON public.rentals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = rentals.condo_id AND c.created_by = auth.uid())
);

-- 19. Common Areas
CREATE TABLE IF NOT EXISTS public.common_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_paid BOOLEAN DEFAULT false,
  usage_fee NUMERIC DEFAULT 0,
  maintenance_responsible TEXT,
  maintenance_notes TEXT,
  photo_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.common_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "common_areas_select" ON public.common_areas;
CREATE POLICY "common_areas_select" ON public.common_areas FOR SELECT USING (true);
DROP POLICY IF EXISTS "common_areas_admin" ON public.common_areas;
CREATE POLICY "common_areas_admin" ON public.common_areas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = common_areas.condo_id AND c.created_by = auth.uid())
);

-- 20. Bank Statements
CREATE TABLE IF NOT EXISTS public.bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  statement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_url TEXT NOT NULL,
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bank_statements_select" ON public.bank_statements;
CREATE POLICY "bank_statements_select" ON public.bank_statements FOR SELECT USING (true);
DROP POLICY IF EXISTS "bank_statements_admin" ON public.bank_statements;
CREATE POLICY "bank_statements_admin" ON public.bank_statements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = bank_statements.condo_id AND c.created_by = auth.uid())
);

-- 21. Monthly Balances
CREATE TABLE IF NOT EXISTS public.monthly_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  saldo_anterior NUMERIC NOT NULL DEFAULT 0,
  ingresos_recaudados NUMERIC NOT NULL DEFAULT 0,
  gastos NUMERIC NOT NULL DEFAULT 0,
  balance_mes NUMERIC NOT NULL DEFAULT 0,
  saldo_final NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(condo_id, year, month)
);
ALTER TABLE public.monthly_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "monthly_balances_select" ON public.monthly_balances;
CREATE POLICY "monthly_balances_select" ON public.monthly_balances FOR SELECT USING (true);
DROP POLICY IF EXISTS "monthly_balances_admin" ON public.monthly_balances;
CREATE POLICY "monthly_balances_admin" ON public.monthly_balances FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = monthly_balances.condo_id AND c.created_by = auth.uid())
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'role', 'owner')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
`

export async function GET() {
  return NextResponse.json({
    sql: MIGRATION_SQL,
    instructions: "Copia este SQL y ejecutalo en el Supabase SQL Editor (supabase.com/dashboard > SQL Editor)",
  })
}
