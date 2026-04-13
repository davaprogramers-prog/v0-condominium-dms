-- Enable RLS on critical tables and create security policies

-- 1. PROFILES - Users can only see their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles in their condominium
CREATE POLICY "Admins can view profiles in their condominium"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.condo_id = (SELECT condo_id FROM profiles p WHERE p.id = profiles.id LIMIT 1)
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- 2. HOUSES - Users can only see their own house
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their house"
  ON houses FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.condo_id = houses.condo_id
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- 3. PAYMENTS - Users can view payments for their properties
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments for their house"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM houses
      WHERE houses.id = payments.house_id
      AND (houses.owner_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM profiles
        WHERE profiles.condo_id = houses.condo_id
        AND profiles.role IN ('super_admin', 'admin')
      ))
    )
  );

CREATE POLICY "Admins can insert payments for their condominium"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM houses
      WHERE houses.id = house_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.condo_id = houses.condo_id
        AND profiles.role IN ('super_admin', 'admin')
      )
    )
  );

-- 4. CONDO_INCOME - Only admins of the condominium can view/edit
ALTER TABLE condo_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view income for their condominium"
  ON condo_income FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.condo_id = condo_income.condo_id
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can insert income for their condominium"
  ON condo_income FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.condo_id = condo_id
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- 5. CONDO_EXPENSES - Only admins of the condominium can view/edit
ALTER TABLE condo_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view expenses for their condominium"
  ON condo_expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.condo_id = condo_expenses.condo_id
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can insert expenses for their condominium"
  ON condo_expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.condo_id = condo_id
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- 6. INFRACTIONS - Users can view their own, admins can view all for their condo
ALTER TABLE infractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view infractions for their house"
  ON infractions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM houses
      WHERE houses.id = house_id
      AND (houses.owner_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM profiles
        WHERE profiles.condo_id = houses.condo_id
        AND profiles.role IN ('super_admin', 'admin')
      ))
    )
  );

-- 7. EXEMPTIONS - Users can view exemptions for their house
ALTER TABLE exemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view exemptions for their house"
  ON exemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM houses
      WHERE houses.id = house_id
      AND (houses.owner_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM profiles
        WHERE profiles.condo_id = houses.condo_id
        AND profiles.role IN ('super_admin', 'admin')
      ))
    )
  );

-- 8. PROJECTS - Users can view projects for their condominium
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects for their condominium"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.condo_id = projects.condo_id
    )
  );

-- 9. PROJECT_QUOTES - Users can view quotes for their condominium
ALTER TABLE project_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quotes for projects in their condominium"
  ON project_quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.condo_id = projects.condo_id
      )
    )
  );

-- 10. SURVEYS - Users can view surveys for their condominium
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view surveys for their condominium"
  ON surveys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.condo_id = surveys.condo_id
    )
  );

-- 11. BANK_STATEMENTS - Only admins can view
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bank statements for their condominium"
  ON bank_statements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.condo_id = bank_statements.condo_id
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON condo_income TO authenticated;
GRANT INSERT, UPDATE, DELETE ON condo_expenses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON payments TO authenticated;

-- Mark migration as complete
COMMENT ON SCHEMA public IS 'Schema with RLS enabled for security - Last updated: RLS policies applied';
