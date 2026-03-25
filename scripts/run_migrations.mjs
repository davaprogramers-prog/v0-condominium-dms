// Run migrations using the Supabase Management API
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

// Use the PostgREST SQL endpoint via supabase-js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: { schema: "public" },
  auth: { persistSession: false },
});

// We'll run all SQL as one big transaction via supabase.from() won't work for DDL.
// Instead, let's use the raw HTTP endpoint for SQL execution.
// The Supabase project has a pg endpoint at /pg/query

const ALL_SQL = `
-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('admin', 'owner')),
  condo_id UUID,
  house_id UUID,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_own' AND tablename = 'profiles') THEN CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_insert_own' AND tablename = 'profiles') THEN CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update_own' AND tablename = 'profiles') THEN CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id); END IF; END $$;

-- 2. CONDOMINIUMS
CREATE TABLE IF NOT EXISTS public.condominiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  total_houses INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CLP',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  currency_multiplier NUMERIC NOT NULL DEFAULT 1,
  common_expense_amount NUMERIC NOT NULL DEFAULT 0,
  admin_id UUID REFERENCES auth.users(id),
  cards_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'condo_select_members' AND tablename = 'condominiums') THEN CREATE POLICY "condo_select_members" ON public.condominiums FOR SELECT USING (admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'condo_admin_all' AND tablename = 'condominiums') THEN CREATE POLICY "condo_admin_all" ON public.condominiums FOR ALL USING (admin_id = auth.uid()); END IF; END $$;

-- 3. HOUSES
CREATE TABLE IF NOT EXISTS public.houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_number TEXT NOT NULL,
  owner_name TEXT,
  owner_email TEXT,
  owner_id UUID REFERENCES auth.users(id),
  avatar_url TEXT,
  payment_due_day INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(condo_id, house_number)
);
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'houses_select' AND tablename = 'houses') THEN CREATE POLICY "houses_select" ON public.houses FOR SELECT USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = houses.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'houses_admin_all' AND tablename = 'houses') THEN CREATE POLICY "houses_admin_all" ON public.houses FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = houses.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 4. EXPENSE TYPES
CREATE TABLE IF NOT EXISTS public.expense_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'expense_types_select' AND tablename = 'expense_types') THEN CREATE POLICY "expense_types_select" ON public.expense_types FOR SELECT USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = expense_types.condo_id AND (condominiums.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'expense_types_admin' AND tablename = 'expense_types') THEN CREATE POLICY "expense_types_admin" ON public.expense_types FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = expense_types.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 5. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  expense_type_id UUID REFERENCES public.expense_types(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'expenses_select' AND tablename = 'expenses') THEN CREATE POLICY "expenses_select" ON public.expenses FOR SELECT USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = expenses.condo_id AND (condominiums.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'expenses_admin' AND tablename = 'expenses') THEN CREATE POLICY "expenses_admin" ON public.expenses FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = expenses.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 6. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'transfer',
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  receipt_url TEXT,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payments_select' AND tablename = 'payments') THEN CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.houses WHERE houses.id = payments.house_id AND houses.owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = payments.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payments_insert' AND tablename = 'payments') THEN CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.houses WHERE houses.id = payments.house_id AND houses.owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = payments.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payments_admin_all' AND tablename = 'payments') THEN CREATE POLICY "payments_admin_all" ON public.payments FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = payments.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 7. VARIABLE INCOME
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
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'variable_income_select' AND tablename = 'variable_income') THEN CREATE POLICY "variable_income_select" ON public.variable_income FOR SELECT USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = variable_income.condo_id AND (condominiums.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'variable_income_admin' AND tablename = 'variable_income') THEN CREATE POLICY "variable_income_admin" ON public.variable_income FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = variable_income.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 8. EXEMPTION TYPES
CREATE TABLE IF NOT EXISTS public.exemption_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.exemption_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'exemption_types_select' AND tablename = 'exemption_types') THEN CREATE POLICY "exemption_types_select" ON public.exemption_types FOR SELECT USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = exemption_types.condo_id AND (condominiums.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'exemption_types_admin' AND tablename = 'exemption_types') THEN CREATE POLICY "exemption_types_admin" ON public.exemption_types FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = exemption_types.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 9. EXEMPTIONS
CREATE TABLE IF NOT EXISTS public.exemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  exemption_type_id UUID REFERENCES public.exemption_types(id),
  is_permanent BOOLEAN DEFAULT false,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.exemptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'exemptions_select' AND tablename = 'exemptions') THEN CREATE POLICY "exemptions_select" ON public.exemptions FOR SELECT USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = exemptions.condo_id AND (condominiums.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'exemptions_admin' AND tablename = 'exemptions') THEN CREATE POLICY "exemptions_admin" ON public.exemptions FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = exemptions.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 10. IMPROVEMENT PROJECTS
CREATE TABLE IF NOT EXISTS public.improvement_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT,
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed','approved','in_progress','completed','cancelled')),
  location_photo_url TEXT,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.improvement_projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'projects_select' AND tablename = 'improvement_projects') THEN CREATE POLICY "projects_select" ON public.improvement_projects FOR SELECT USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = improvement_projects.condo_id AND (condominiums.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'projects_admin' AND tablename = 'improvement_projects') THEN CREATE POLICY "projects_admin" ON public.improvement_projects FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = improvement_projects.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 11. QUOTATIONS
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.improvement_projects(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  file_url TEXT,
  selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quotations_select' AND tablename = 'quotations') THEN CREATE POLICY "quotations_select" ON public.quotations FOR SELECT USING (EXISTS (SELECT 1 FROM public.improvement_projects ip JOIN public.condominiums c ON c.id = ip.condo_id WHERE ip.id = quotations.project_id AND (c.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = c.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quotations_admin' AND tablename = 'quotations') THEN CREATE POLICY "quotations_admin" ON public.quotations FOR ALL USING (EXISTS (SELECT 1 FROM public.improvement_projects ip JOIN public.condominiums c ON c.id = ip.condo_id WHERE ip.id = quotations.project_id AND c.admin_id = auth.uid())); END IF; END $$;

-- 12. SURVEYS
CREATE TABLE IF NOT EXISTS public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ
);
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'surveys_select' AND tablename = 'surveys') THEN CREATE POLICY "surveys_select" ON public.surveys FOR SELECT USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = surveys.condo_id AND (condominiums.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'surveys_admin' AND tablename = 'surveys') THEN CREATE POLICY "surveys_admin" ON public.surveys FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = surveys.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 13. SURVEY OPTIONS
CREATE TABLE IF NOT EXISTS public.survey_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.survey_options ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'survey_options_select' AND tablename = 'survey_options') THEN CREATE POLICY "survey_options_select" ON public.survey_options FOR SELECT USING (EXISTS (SELECT 1 FROM public.surveys s JOIN public.condominiums c ON c.id = s.condo_id WHERE s.id = survey_options.survey_id AND (c.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = c.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'survey_options_admin' AND tablename = 'survey_options') THEN CREATE POLICY "survey_options_admin" ON public.survey_options FOR ALL USING (EXISTS (SELECT 1 FROM public.surveys s JOIN public.condominiums c ON c.id = s.condo_id WHERE s.id = survey_options.survey_id AND c.admin_id = auth.uid())); END IF; END $$;

-- 14. SURVEY VOTES
CREATE TABLE IF NOT EXISTS public.survey_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.survey_options(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, voter_id)
);
ALTER TABLE public.survey_votes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'survey_votes_select' AND tablename = 'survey_votes') THEN CREATE POLICY "survey_votes_select" ON public.survey_votes FOR SELECT USING (EXISTS (SELECT 1 FROM public.surveys s JOIN public.condominiums c ON c.id = s.condo_id WHERE s.id = survey_votes.survey_id AND (c.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = c.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'survey_votes_insert' AND tablename = 'survey_votes') THEN CREATE POLICY "survey_votes_insert" ON public.survey_votes FOR INSERT WITH CHECK (voter_id = auth.uid()); END IF; END $$;

-- 15. DOCUMENT TYPES
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'doc_types_select' AND tablename = 'document_types') THEN CREATE POLICY "doc_types_select" ON public.document_types FOR SELECT USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = document_types.condo_id AND (condominiums.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'doc_types_admin' AND tablename = 'document_types') THEN CREATE POLICY "doc_types_admin" ON public.document_types FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = document_types.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 16. DOCUMENTS
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
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'documents_select' AND tablename = 'documents') THEN CREATE POLICY "documents_select" ON public.documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = documents.condo_id AND (condominiums.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'documents_admin' AND tablename = 'documents') THEN CREATE POLICY "documents_admin" ON public.documents FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = documents.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 17. INFRACTIONS
CREATE TABLE IF NOT EXISTS public.infractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  fine_amount NUMERIC DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  infraction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  evidence_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.infractions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'infractions_select' AND tablename = 'infractions') THEN CREATE POLICY "infractions_select" ON public.infractions FOR SELECT USING (EXISTS (SELECT 1 FROM public.houses WHERE houses.id = infractions.house_id AND houses.owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = infractions.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'infractions_admin' AND tablename = 'infractions') THEN CREATE POLICY "infractions_admin" ON public.infractions FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = infractions.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 18. RENTALS
CREATE TABLE IF NOT EXISTS public.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  space_name TEXT NOT NULL,
  photo_url TEXT,
  monthly_amount NUMERIC NOT NULL DEFAULT 0,
  tenant_name TEXT,
  tenant_contact TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rentals_select' AND tablename = 'rentals') THEN CREATE POLICY "rentals_select" ON public.rentals FOR SELECT USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = rentals.condo_id AND (condominiums.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rentals_admin' AND tablename = 'rentals') THEN CREATE POLICY "rentals_admin" ON public.rentals FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = rentals.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 19. COMMON AREAS
CREATE TABLE IF NOT EXISTS public.common_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_paid BOOLEAN DEFAULT false,
  usage_fee NUMERIC DEFAULT 0,
  maintenance_responsible TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.common_areas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'common_areas_select' AND tablename = 'common_areas') THEN CREATE POLICY "common_areas_select" ON public.common_areas FOR SELECT USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = common_areas.condo_id AND (condominiums.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'common_areas_admin' AND tablename = 'common_areas') THEN CREATE POLICY "common_areas_admin" ON public.common_areas FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = common_areas.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 20. BANK STATEMENTS
CREATE TABLE IF NOT EXISTS public.bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  statement_month INTEGER NOT NULL,
  statement_year INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bank_statements_select' AND tablename = 'bank_statements') THEN CREATE POLICY "bank_statements_select" ON public.bank_statements FOR SELECT USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = bank_statements.condo_id AND (condominiums.admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bank_statements_admin' AND tablename = 'bank_statements') THEN CREATE POLICY "bank_statements_admin" ON public.bank_statements FOR ALL USING (EXISTS (SELECT 1 FROM public.condominiums WHERE condominiums.id = bank_statements.condo_id AND condominiums.admin_id = auth.uid())); END IF; END $$;

-- 21. PROFILE TRIGGER
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

-- 22. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.survey_votes;
`;

console.log("Full SQL migration script ready. Length:", ALL_SQL.length, "chars");
console.log("This script should be run via the Supabase SQL Editor or MCP apply_migration tool.");
console.log(ALL_SQL);
