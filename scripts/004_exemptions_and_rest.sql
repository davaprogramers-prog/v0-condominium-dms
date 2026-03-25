-- Exemption types
CREATE TABLE IF NOT EXISTS public.exemption_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.exemption_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exemption_types_select" ON public.exemption_types FOR SELECT USING (true);
CREATE POLICY "exemption_types_manage" ON public.exemption_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Exemptions
CREATE TABLE IF NOT EXISTS public.exemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  exemption_type_id UUID NOT NULL REFERENCES public.exemption_types(id),
  is_permanent BOOLEAN DEFAULT false,
  start_date DATE NOT NULL,
  end_date DATE,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.exemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exemptions_select" ON public.exemptions FOR SELECT USING (true);
CREATE POLICY "exemptions_manage" ON public.exemptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Project types
CREATE TABLE IF NOT EXISTS public.project_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_types_select" ON public.project_types FOR SELECT USING (true);
CREATE POLICY "project_types_manage" ON public.project_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  project_type_id UUID REFERENCES public.project_types(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planificado' CHECK (status IN ('planificado', 'en_curso', 'completado')),
  location_photo_url TEXT,
  budget NUMERIC,
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects_manage" ON public.projects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Project quotations
CREATE TABLE IF NOT EXISTS public.project_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotations_select" ON public.project_quotations FOR SELECT USING (true);
CREATE POLICY "quotations_manage" ON public.project_quotations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.condominiums c ON c.id = p.condo_id
    WHERE p.id = project_id AND c.admin_user_id = auth.uid()
  )
);

-- Project photos
CREATE TABLE IF NOT EXISTS public.project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_photos_select" ON public.project_photos FOR SELECT USING (true);
CREATE POLICY "project_photos_manage" ON public.project_photos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.condominiums c ON c.id = p.condo_id
    WHERE p.id = project_id AND c.admin_user_id = auth.uid()
  )
);

-- Surveys
CREATE TABLE IF NOT EXISTS public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'activa' CHECK (status IN ('activa', 'cerrada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  closes_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surveys_select" ON public.surveys FOR SELECT USING (true);
CREATE POLICY "surveys_manage" ON public.surveys FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Survey options
CREATE TABLE IF NOT EXISTS public.survey_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL
);

ALTER TABLE public.survey_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "survey_options_select" ON public.survey_options FOR SELECT USING (true);
CREATE POLICY "survey_options_manage" ON public.survey_options FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.surveys s
    JOIN public.condominiums c ON c.id = s.condo_id
    WHERE s.id = survey_id AND c.admin_user_id = auth.uid()
  )
);

-- Survey votes
CREATE TABLE IF NOT EXISTS public.survey_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.survey_options(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  voted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, house_id)
);

ALTER TABLE public.survey_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_select" ON public.survey_votes FOR SELECT USING (true);
CREATE POLICY "votes_insert" ON public.survey_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Document types
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_types_select" ON public.document_types FOR SELECT USING (true);
CREATE POLICY "doc_types_manage" ON public.document_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES public.document_types(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_select" ON public.documents FOR SELECT USING (true);
CREATE POLICY "documents_manage" ON public.documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Violations / infractions
CREATE TABLE IF NOT EXISTS public.violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  fine_amount NUMERIC,
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "violations_select" ON public.violations FOR SELECT USING (true);
CREATE POLICY "violations_manage" ON public.violations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Rental spaces
CREATE TABLE IF NOT EXISTS public.rental_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  monthly_rate NUMERIC NOT NULL DEFAULT 0,
  tenant_name TEXT,
  tenant_contact TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rental_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rentals_select" ON public.rental_spaces FOR SELECT USING (true);
CREATE POLICY "rentals_manage" ON public.rental_spaces FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Common areas
CREATE TABLE IF NOT EXISTS public.common_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  maintenance_responsible TEXT,
  is_paid_maintenance BOOLEAN DEFAULT false,
  maintenance_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.common_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "common_areas_select" ON public.common_areas FOR SELECT USING (true);
CREATE POLICY "common_areas_manage" ON public.common_areas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Bank statements
CREATE TABLE IF NOT EXISTS public.bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bank_statements_select" ON public.bank_statements FOR SELECT USING (true);
CREATE POLICY "bank_statements_manage" ON public.bank_statements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
