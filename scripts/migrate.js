import postgres from "postgres";

const databaseUrl = process.env.POSTGRES_URL;
if (!databaseUrl) {
  console.error("POSTGRES_URL environment variable is not set");
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: "require" });

async function run(label, query) {
  try {
    await sql.unsafe(query);
    console.log("  [OK] " + label);
  } catch (err) {
    console.error("  [FAIL] " + label + ": " + err.message);
  }
}

async function migrate() {
  console.log("Starting CondoAdmin migration...\n");

  // ========== TABLES ==========
  console.log("Creating tables...");

  await run("profiles", `
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'owner',
      condo_id UUID,
      house_id UUID,
      first_name TEXT,
      last_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  await run("profiles RLS", `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY`);

  await run("condominiums", `
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
    )`);
  await run("condominiums RLS", `ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY`);

  await run("houses", `
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
    )`);
  await run("houses RLS", `ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY`);

  await run("expense_types", `
    CREATE TABLE IF NOT EXISTS public.expense_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  await run("expense_types RLS", `ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY`);

  await run("expenses", `
    CREATE TABLE IF NOT EXISTS public.expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
      expense_type_id UUID REFERENCES public.expense_types(id),
      description TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
      receipt_url TEXT,
      notes TEXT,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  await run("expenses RLS", `ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY`);

  await run("payments", `
    CREATE TABLE IF NOT EXISTS public.payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
      house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL,
      payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      period_month INTEGER NOT NULL,
      period_year INTEGER NOT NULL,
      payment_method TEXT DEFAULT 'transferencia',
      receipt_url TEXT,
      status TEXT NOT NULL DEFAULT 'pendiente',
      verified_by UUID REFERENCES auth.users(id),
      verified_at TIMESTAMPTZ,
      notes TEXT,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  await run("payments RLS", `ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY`);

  await run("variable_income", `
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
    )`);
  await run("variable_income RLS", `ALTER TABLE public.variable_income ENABLE ROW LEVEL SECURITY`);

  await run("exemption_types", `
    CREATE TABLE IF NOT EXISTS public.exemption_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  await run("exemption_types RLS", `ALTER TABLE public.exemption_types ENABLE ROW LEVEL SECURITY`);

  await run("exemptions", `
    CREATE TABLE IF NOT EXISTS public.exemptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
      house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
      exemption_type_id UUID REFERENCES public.exemption_types(id),
      is_permanent BOOLEAN NOT NULL DEFAULT false,
      start_date DATE NOT NULL DEFAULT CURRENT_DATE,
      end_date DATE,
      percentage NUMERIC NOT NULL DEFAULT 100,
      reason TEXT,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  await run("exemptions RLS", `ALTER TABLE public.exemptions ENABLE ROW LEVEL SECURITY`);

  await run("projects", `
    CREATE TABLE IF NOT EXISTS public.projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      improvement_type TEXT,
      location_description TEXT,
      location_photo_url TEXT,
      status TEXT NOT NULL DEFAULT 'propuesto',
      estimated_cost NUMERIC,
      actual_cost NUMERIC,
      start_date DATE,
      end_date DATE,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  await run("projects RLS", `ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY`);

  await run("project_quotes", `
    CREATE TABLE IF NOT EXISTS public.project_quotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
      vendor_name TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      description TEXT,
      document_url TEXT,
      is_selected BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  await run("project_quotes RLS", `ALTER TABLE public.project_quotes ENABLE ROW LEVEL SECURITY`);

  await run("surveys", `
    CREATE TABLE IF NOT EXISTS public.surveys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT now(),
      closes_at TIMESTAMPTZ
    )`);
  await run("surveys RLS", `ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY`);

  await run("survey_options", `
    CREATE TABLE IF NOT EXISTS public.survey_options (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
      option_text TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  await run("survey_options RLS", `ALTER TABLE public.survey_options ENABLE ROW LEVEL SECURITY`);

  await run("survey_votes", `
    CREATE TABLE IF NOT EXISTS public.survey_votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
      option_id UUID NOT NULL REFERENCES public.survey_options(id) ON DELETE CASCADE,
      voter_id UUID NOT NULL REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(survey_id, voter_id)
    )`);
  await run("survey_votes RLS", `ALTER TABLE public.survey_votes ENABLE ROW LEVEL SECURITY`);

  await run("document_types", `
    CREATE TABLE IF NOT EXISTS public.document_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  await run("document_types RLS", `ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY`);

  await run("documents", `
    CREATE TABLE IF NOT EXISTS public.documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
      document_type_id UUID REFERENCES public.document_types(id),
      title TEXT NOT NULL,
      description TEXT,
      file_url TEXT NOT NULL,
      uploaded_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  await run("documents RLS", `ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY`);

  await run("infractions", `
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
    )`);
  await run("infractions RLS", `ALTER TABLE public.infractions ENABLE ROW LEVEL SECURITY`);

  await run("rentals", `
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
    )`);
  await run("rentals RLS", `ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY`);

  await run("common_areas", `
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
    )`);
  await run("common_areas RLS", `ALTER TABLE public.common_areas ENABLE ROW LEVEL SECURITY`);

  await run("bank_statements", `
    CREATE TABLE IF NOT EXISTS public.bank_statements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      statement_month INTEGER NOT NULL,
      statement_year INTEGER NOT NULL,
      file_url TEXT NOT NULL,
      uploaded_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
  await run("bank_statements RLS", `ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY`);

  // ========== RLS POLICIES ==========
  console.log("\nCreating RLS policies...");

  // Profiles - public read, own write
  await run("profiles policies", `
    DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
    CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
    DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
    CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
    CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id)
  `);

  // Condominiums - public read, creator manages
  await run("condominiums policies", `
    DROP POLICY IF EXISTS "condo_select" ON public.condominiums;
    CREATE POLICY "condo_select" ON public.condominiums FOR SELECT USING (true);
    DROP POLICY IF EXISTS "condo_insert" ON public.condominiums;
    CREATE POLICY "condo_insert" ON public.condominiums FOR INSERT WITH CHECK (auth.uid() = created_by);
    DROP POLICY IF EXISTS "condo_update" ON public.condominiums;
    CREATE POLICY "condo_update" ON public.condominiums FOR UPDATE USING (auth.uid() = created_by);
    DROP POLICY IF EXISTS "condo_delete" ON public.condominiums;
    CREATE POLICY "condo_delete" ON public.condominiums FOR DELETE USING (auth.uid() = created_by)
  `);

  // For all other tables: public read, admin role manages
  const adminTables = [
    "houses", "expense_types", "expenses", "payments", "variable_income",
    "exemption_types", "exemptions", "projects", "project_quotes",
    "surveys", "survey_options", "document_types", "documents",
    "infractions", "rentals", "common_areas", "bank_statements"
  ];

  for (const t of adminTables) {
    await run(t + " policies", `
      DROP POLICY IF EXISTS "${t}_select" ON public.${t};
      CREATE POLICY "${t}_select" ON public.${t} FOR SELECT USING (true);
      DROP POLICY IF EXISTS "${t}_insert" ON public.${t};
      CREATE POLICY "${t}_insert" ON public.${t} FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
      DROP POLICY IF EXISTS "${t}_update" ON public.${t};
      CREATE POLICY "${t}_update" ON public.${t} FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
      DROP POLICY IF EXISTS "${t}_delete" ON public.${t};
      CREATE POLICY "${t}_delete" ON public.${t} FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    `);
  }

  // Extra: survey votes - any auth user can insert their own vote
  await run("survey_votes voter policy", `
    DROP POLICY IF EXISTS "votes_own_insert" ON public.survey_votes;
    CREATE POLICY "votes_own_insert" ON public.survey_votes FOR INSERT WITH CHECK (auth.uid() = voter_id)
  `);

  // Extra: payments - house owners can also insert (upload receipts)
  await run("payments owner policy", `
    DROP POLICY IF EXISTS "payments_owner_insert" ON public.payments;
    CREATE POLICY "payments_owner_insert" ON public.payments FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.houses WHERE id = payments.house_id AND owner_user_id = auth.uid())
    )
  `);

  // ========== TRIGGER ==========
  console.log("\nCreating profile trigger...");

  await run("handle_new_user function", `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      INSERT INTO public.profiles (id, role, first_name, last_name)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data ->> 'role', 'owner'),
        COALESCE(new.raw_user_meta_data ->> 'first_name', NULL),
        COALESCE(new.raw_user_meta_data ->> 'last_name', NULL)
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN new;
    END;
    $$
  `);

  await run("trigger on_auth_user_created", `
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user()
  `);

  console.log("\nMigration complete!");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
