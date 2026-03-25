import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const sql = `
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

-- 8. Exemption types
CREATE TABLE IF NOT EXISTS public.exemption_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.exemption_types ENABLE ROW LEVEL SECURITY;

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

-- 13. Survey options
CREATE TABLE IF NOT EXISTS public.survey_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.survey_options ENABLE ROW LEVEL SECURITY;

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

-- 15. Document types
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

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

-- Profile trigger
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

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('expenses', 'expenses', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('projects', 'projects', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('rentals', 'rentals', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('statements', 'statements', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
`

  // Execute via Supabase Management API
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${process.env.SUPABASE_PROJECT_REF || 'inwjtekehhoxqcirhaox'}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  )

  if (!response.ok) {
    // Fallback: try individual statements via the sql endpoint
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 5)

    const results: { step: number; status: string; error?: string }[] = []
    
    for (let i = 0; i < statements.length; i++) {
      try {
        const { error } = await supabase.from("_migrations_log").select("*").limit(0)
        // Use rpc or direct SQL isn't available through supabase-js
        // We'll rely on the migration files approach
        results.push({ step: i, status: "skipped" })
      } catch (e) {
        results.push({ step: i, status: "error", error: String(e) })
      }
    }

    return NextResponse.json({
      message: "Migration needs to be run via Supabase Dashboard SQL Editor. Copy the SQL from /scripts/001_base_tables.sql",
      note: "The Supabase JS client doesn't support raw DDL. Please run the migration manually.",
    })
  }

  const result = await response.json()
  return NextResponse.json({ success: true, result })
}
