-- =============================================
-- CondoAdmin - Complete Database Migration
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('admin', 'owner')),
  condo_id UUID,
  house_id UUID,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Condominiums
CREATE TABLE IF NOT EXISTS public.condominiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  currency TEXT NOT NULL DEFAULT 'CLP',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  currency_multiplier NUMERIC NOT NULL DEFAULT 1,
  total_houses INTEGER NOT NULL DEFAULT 1,
  common_expense_amount NUMERIC NOT NULL DEFAULT 0,
  cards_public BOOLEAN NOT NULL DEFAULT false,
  payment_deadline_day INTEGER NOT NULL DEFAULT 5,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "condo_select_members" ON public.condominiums FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid())
);
CREATE POLICY "condo_insert_admin" ON public.condominiums FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "condo_update_admin" ON public.condominiums FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = condominiums.id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 3. Houses
CREATE TABLE IF NOT EXISTS public.houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_number TEXT NOT NULL,
  owner_name TEXT,
  owner_email TEXT,
  owner_user_id UUID REFERENCES auth.users(id),
  avatar_url TEXT,
  payment_deadline_day INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(condo_id, house_number)
);
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "houses_select_condo" ON public.houses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = houses.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "houses_insert_admin" ON public.houses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = houses.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "houses_update_admin" ON public.houses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = houses.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 4. Expense types
CREATE TABLE IF NOT EXISTS public.expense_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_types_select" ON public.expense_types FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = expense_types.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "expense_types_insert_admin" ON public.expense_types FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = expense_types.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "expense_types_update_admin" ON public.expense_types FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = expense_types.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 5. Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  expense_type_id UUID NOT NULL REFERENCES public.expense_types(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = expenses.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "expenses_insert_admin" ON public.expenses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = expenses.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "expenses_update_admin" ON public.expenses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = expenses.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "expenses_delete_admin" ON public.expenses FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = expenses.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 6. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('transferencia', 'deposito', 'cheque', 'efectivo', 'otro')),
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'verificado', 'rechazado')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_condo" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = payments.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = payments.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "payments_update_admin" ON public.payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = payments.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 7. Variable income
CREATE TABLE IF NOT EXISTS public.variable_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT,
  receipt_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.variable_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "var_income_select" ON public.variable_income FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = variable_income.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "var_income_insert_admin" ON public.variable_income FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = variable_income.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 8. Exemption types
CREATE TABLE IF NOT EXISTS public.exemption_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.exemption_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exemption_types_select" ON public.exemption_types FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = exemption_types.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "exemption_types_manage_admin" ON public.exemption_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = exemption_types.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 9. Exemptions
CREATE TABLE IF NOT EXISTS public.exemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  exemption_type_id UUID NOT NULL REFERENCES public.exemption_types(id),
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  percentage NUMERIC NOT NULL DEFAULT 100,
  reason TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.exemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exemptions_select" ON public.exemptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = exemptions.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "exemptions_manage_admin" ON public.exemptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = exemptions.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 10. Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  improvement_type TEXT,
  location_description TEXT,
  location_photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'propuesto' CHECK (status IN ('propuesto', 'aprobado', 'en_progreso', 'completado', 'cancelado')),
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = projects.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "projects_manage_admin" ON public.projects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = projects.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 11. Project quotes
CREATE TABLE IF NOT EXISTS public.project_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  document_url TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.project_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_select" ON public.project_quotes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p JOIN public.profiles pr ON pr.condo_id = p.condo_id WHERE p.id = project_quotes.project_id AND pr.id = auth.uid())
);
CREATE POLICY "quotes_manage_admin" ON public.project_quotes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p JOIN public.profiles pr ON pr.condo_id = p.condo_id WHERE p.id = project_quotes.project_id AND pr.id = auth.uid() AND pr.role = 'admin')
);

-- 12. Surveys
CREATE TABLE IF NOT EXISTS public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allow_multiple_votes BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  closes_at TIMESTAMPTZ
);
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surveys_select" ON public.surveys FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = surveys.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "surveys_manage_admin" ON public.surveys FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = surveys.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 13. Survey options
CREATE TABLE IF NOT EXISTS public.survey_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.survey_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "survey_options_select" ON public.survey_options FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.surveys s JOIN public.profiles p ON p.condo_id = s.condo_id WHERE s.id = survey_options.survey_id AND p.id = auth.uid())
);
CREATE POLICY "survey_options_manage" ON public.survey_options FOR ALL USING (
  EXISTS (SELECT 1 FROM public.surveys s JOIN public.profiles p ON p.condo_id = s.condo_id WHERE s.id = survey_options.survey_id AND p.id = auth.uid() AND p.role = 'admin')
);

-- 14. Survey votes
CREATE TABLE IF NOT EXISTS public.survey_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.survey_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, user_id)
);
ALTER TABLE public.survey_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_select" ON public.survey_votes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.surveys s JOIN public.profiles p ON p.condo_id = s.condo_id WHERE s.id = survey_votes.survey_id AND p.id = auth.uid())
);
CREATE POLICY "votes_insert" ON public.survey_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 15. Document types
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_types_select" ON public.document_types FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = document_types.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "doc_types_manage" ON public.document_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = document_types.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 16. Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES public.document_types(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs_select" ON public.documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = documents.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "docs_manage" ON public.documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = documents.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 17. Infractions
CREATE TABLE IF NOT EXISTS public.infractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  fine_amount NUMERIC,
  infraction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_date DATE,
  paid_receipt_url TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.infractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "infractions_select" ON public.infractions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = infractions.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "infractions_manage" ON public.infractions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = infractions.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
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
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rentals_select" ON public.rentals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = rentals.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "rentals_manage" ON public.rentals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = rentals.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 19. Common areas
CREATE TABLE IF NOT EXISTS public.common_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  usage_fee NUMERIC DEFAULT 0,
  maintenance_responsible TEXT,
  maintenance_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.common_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "areas_select" ON public.common_areas FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = common_areas.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "areas_manage" ON public.common_areas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = common_areas.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 20. Bank statements
CREATE TABLE IF NOT EXISTS public.bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  statement_date DATE NOT NULL,
  file_url TEXT NOT NULL,
  notes TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "statements_select" ON public.bank_statements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = bank_statements.condo_id AND profiles.id = auth.uid())
);
CREATE POLICY "statements_manage" ON public.bank_statements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.condo_id = bank_statements.condo_id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 21. Profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'role', 'owner')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 22. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('expenses', 'expenses', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('projects', 'projects', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('rentals', 'rentals', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('statements', 'statements', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- 23. Storage policies
CREATE POLICY "allow_authenticated_uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_public_reads" ON storage.objects FOR SELECT TO public USING (true);
CREATE POLICY "allow_authenticated_updates" ON storage.objects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "allow_authenticated_deletes" ON storage.objects FOR DELETE TO authenticated USING (true);

-- 24. Condominium Themes
CREATE TABLE IF NOT EXISTS public.condominium_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL UNIQUE REFERENCES public.condominiums(id) ON DELETE CASCADE,
  enable_custom_theme BOOLEAN DEFAULT false,
  sidebar_bg_color VARCHAR(7) DEFAULT '#1e293b',
  main_bg_color VARCHAR(7) DEFAULT '#f1f5f9',
  card_bg_color VARCHAR(7) DEFAULT '#ffffff',
  sidebar_text_color VARCHAR(7) DEFAULT '#ffffff',
  main_text_color VARCHAR(7) DEFAULT '#0f172a',
  card_text_color VARCHAR(7) DEFAULT '#0f172a',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 25. Habilitar RLS para condominium_themes
ALTER TABLE public.condominium_themes ENABLE ROW LEVEL SECURITY;

-- 26. Política de lectura para condominium_themes
CREATE POLICY "themes_select_user" ON public.condominium_themes 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.condo_id = condominium_themes.condo_id 
      AND profiles.id = auth.uid()
    )
  );

-- 27. Política de actualización para condominium_themes (solo admins)
CREATE POLICY "themes_update_admin" ON public.condominium_themes 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.condo_id = condominium_themes.condo_id 
      AND profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 28. Política de inserción para condominium_themes (solo admins)
CREATE POLICY "themes_insert_admin" ON public.condominium_themes 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.condo_id = condominium_themes.condo_id 
      AND profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
