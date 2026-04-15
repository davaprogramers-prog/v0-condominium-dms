-- RLS Policies for Super Admin
-- Super admins need full access to all tables to manage the entire system

-- Helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES TABLE
DROP POLICY IF EXISTS "Super admin full access to profiles" ON public.profiles;
CREATE POLICY "Super admin full access to profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- CONDOMINIUMS TABLE
DROP POLICY IF EXISTS "Super admin full access to condominiums" ON public.condominiums;
CREATE POLICY "Super admin full access to condominiums" ON public.condominiums
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- HOUSES TABLE
DROP POLICY IF EXISTS "Super admin full access to houses" ON public.houses;
CREATE POLICY "Super admin full access to houses" ON public.houses
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- EXPENSES TABLE
DROP POLICY IF EXISTS "Super admin full access to expenses" ON public.expenses;
CREATE POLICY "Super admin full access to expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- PAYMENTS TABLE
DROP POLICY IF EXISTS "Super admin full access to payments" ON public.payments;
CREATE POLICY "Super admin full access to payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- CONDO_EXPENSES TABLE
DROP POLICY IF EXISTS "Super admin full access to condo_expenses" ON public.condo_expenses;
CREATE POLICY "Super admin full access to condo_expenses" ON public.condo_expenses
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- CONDO_INCOME TABLE
DROP POLICY IF EXISTS "Super admin full access to condo_income" ON public.condo_income;
CREATE POLICY "Super admin full access to condo_income" ON public.condo_income
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- BANK_STATEMENTS TABLE
DROP POLICY IF EXISTS "Super admin full access to bank_statements" ON public.bank_statements;
CREATE POLICY "Super admin full access to bank_statements" ON public.bank_statements
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- HOUSE_EXPENSES TABLE
DROP POLICY IF EXISTS "Super admin full access to house_expenses" ON public.house_expenses;
CREATE POLICY "Super admin full access to house_expenses" ON public.house_expenses
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- EXEMPTIONS TABLE
DROP POLICY IF EXISTS "Super admin full access to exemptions" ON public.exemptions;
CREATE POLICY "Super admin full access to exemptions" ON public.exemptions
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- EXEMPTION_TYPES TABLE
DROP POLICY IF EXISTS "Super admin full access to exemption_types" ON public.exemption_types;
CREATE POLICY "Super admin full access to exemption_types" ON public.exemption_types
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- PROJECTS TABLE
DROP POLICY IF EXISTS "Super admin full access to projects" ON public.projects;
CREATE POLICY "Super admin full access to projects" ON public.projects
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- PROJECT_QUOTES TABLE
DROP POLICY IF EXISTS "Super admin full access to project_quotes" ON public.project_quotes;
CREATE POLICY "Super admin full access to project_quotes" ON public.project_quotes
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- INFRACTIONS TABLE
DROP POLICY IF EXISTS "Super admin full access to infractions" ON public.infractions;
CREATE POLICY "Super admin full access to infractions" ON public.infractions
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- SURVEYS TABLE
DROP POLICY IF EXISTS "Super admin full access to surveys" ON public.surveys;
CREATE POLICY "Super admin full access to surveys" ON public.surveys
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- VISITS TABLE
DROP POLICY IF EXISTS "Super admin full access to visits" ON public.visits;
CREATE POLICY "Super admin full access to visits" ON public.visits
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- EXPENSE_LOGOS TABLE
DROP POLICY IF EXISTS "Super admin full access to expense_logos" ON public.expense_logos;
CREATE POLICY "Super admin full access to expense_logos" ON public.expense_logos
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- NOTIFICATIONS TABLE
DROP POLICY IF EXISTS "Super admin full access to notifications" ON public.notifications;
CREATE POLICY "Super admin full access to notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- SUPPLY_REQUESTS TABLE
DROP POLICY IF EXISTS "Super admin full access to supply_requests" ON public.supply_requests;
CREATE POLICY "Super admin full access to supply_requests" ON public.supply_requests
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- PARCELS TABLE
DROP POLICY IF EXISTS "Super admin full access to parcels" ON public.parcels;
CREATE POLICY "Super admin full access to parcels" ON public.parcels
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- COMMON_AREAS TABLE
DROP POLICY IF EXISTS "Super admin full access to common_areas" ON public.common_areas;
CREATE POLICY "Super admin full access to common_areas" ON public.common_areas
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- SURVEY_VOTES TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'survey_votes') THEN
    DROP POLICY IF EXISTS "Super admin full access to survey_votes" ON public.survey_votes;
    CREATE POLICY "Super admin full access to survey_votes" ON public.survey_votes
      FOR ALL TO authenticated
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END $$;

-- USER_CONDOMINIUMS TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_condominiums') THEN
    DROP POLICY IF EXISTS "Super admin full access to user_condominiums" ON public.user_condominiums;
    CREATE POLICY "Super admin full access to user_condominiums" ON public.user_condominiums
      FOR ALL TO authenticated
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END $$;

-- DOCUMENTS TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    DROP POLICY IF EXISTS "Super admin full access to documents" ON public.documents;
    CREATE POLICY "Super admin full access to documents" ON public.documents
      FOR ALL TO authenticated
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END $$;

-- EXPENSE_TYPES TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_types') THEN
    DROP POLICY IF EXISTS "Super admin full access to expense_types" ON public.expense_types;
    CREATE POLICY "Super admin full access to expense_types" ON public.expense_types
      FOR ALL TO authenticated
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END $$;

-- THEMES TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'themes') THEN
    DROP POLICY IF EXISTS "Super admin full access to themes" ON public.themes;
    CREATE POLICY "Super admin full access to themes" ON public.themes
      FOR ALL TO authenticated
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END $$;

-- CONDO_THEMES TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'condo_themes') THEN
    DROP POLICY IF EXISTS "Super admin full access to condo_themes" ON public.condo_themes;
    CREATE POLICY "Super admin full access to condo_themes" ON public.condo_themes
      FOR ALL TO authenticated
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END $$;
