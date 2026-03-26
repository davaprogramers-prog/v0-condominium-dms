-- Fix RLS policies to include super_admin with same permissions as admin
-- Only includes tables that exist in the database

-- =====================
-- PROFILES
-- =====================
DROP POLICY IF EXISTS "Users can view profiles in same condo" ON profiles;
CREATE POLICY "Users can view profiles in same condo" ON profiles
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- HOUSES
-- =====================
DROP POLICY IF EXISTS "Users can view houses in their condo" ON houses;
CREATE POLICY "Users can view houses in their condo" ON houses
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage houses" ON houses;
CREATE POLICY "Admins can manage houses" ON houses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = houses.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- CONDO_EXPENSES
-- =====================
DROP POLICY IF EXISTS "Users can view expenses in their condo" ON condo_expenses;
CREATE POLICY "Users can view expenses in their condo" ON condo_expenses
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage expenses" ON condo_expenses;
CREATE POLICY "Admins can manage expenses" ON condo_expenses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = condo_expenses.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- CONDO_INCOME
-- =====================
DROP POLICY IF EXISTS "Users can view income in their condo" ON condo_income;
CREATE POLICY "Users can view income in their condo" ON condo_income
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage income" ON condo_income;
CREATE POLICY "Admins can manage income" ON condo_income
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = condo_income.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- EXPENSE_TYPES
-- =====================
DROP POLICY IF EXISTS "Users can view expense types in their condo" ON expense_types;
CREATE POLICY "Users can view expense types in their condo" ON expense_types
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage expense types" ON expense_types;
CREATE POLICY "Admins can manage expense types" ON expense_types
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = expense_types.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- EXEMPTION_TYPES
-- =====================
DROP POLICY IF EXISTS "Users can view exemption types in their condo" ON exemption_types;
CREATE POLICY "Users can view exemption types in their condo" ON exemption_types
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage exemption types" ON exemption_types;
CREATE POLICY "Admins can manage exemption types" ON exemption_types
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = exemption_types.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- COMMON_AREAS
-- =====================
DROP POLICY IF EXISTS "Users can view common areas in their condo" ON common_areas;
CREATE POLICY "Users can view common areas in their condo" ON common_areas
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage common areas" ON common_areas;
CREATE POLICY "Admins can manage common areas" ON common_areas
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = common_areas.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- AREA_RESERVATIONS
-- =====================
DROP POLICY IF EXISTS "Users can view reservations in their condo" ON area_reservations;
CREATE POLICY "Users can view reservations in their condo" ON area_reservations
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Users can manage own reservations" ON area_reservations;
CREATE POLICY "Users can manage own reservations" ON area_reservations
FOR ALL TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = area_reservations.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- INFRACTIONS
-- =====================
DROP POLICY IF EXISTS "Users can view infractions in their condo" ON infractions;
CREATE POLICY "Users can view infractions in their condo" ON infractions
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage infractions" ON infractions;
CREATE POLICY "Admins can manage infractions" ON infractions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = infractions.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- DOCUMENTS
-- =====================
DROP POLICY IF EXISTS "Users can view documents in their condo" ON documents;
CREATE POLICY "Users can view documents in their condo" ON documents
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage documents" ON documents;
CREATE POLICY "Admins can manage documents" ON documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = documents.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- BANK_STATEMENTS
-- =====================
DROP POLICY IF EXISTS "Users can view bank statements in their condo" ON bank_statements;
CREATE POLICY "Users can view bank statements in their condo" ON bank_statements
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage bank statements" ON bank_statements;
CREATE POLICY "Admins can manage bank statements" ON bank_statements
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = bank_statements.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- PROJECTS
-- =====================
DROP POLICY IF EXISTS "Users can view projects in their condo" ON projects;
CREATE POLICY "Users can view projects in their condo" ON projects
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage projects" ON projects;
CREATE POLICY "Admins can manage projects" ON projects
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = projects.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- PROJECT_QUOTES
-- =====================
DROP POLICY IF EXISTS "Users can view project quotes" ON project_quotes;
CREATE POLICY "Users can view project quotes" ON project_quotes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_quotes.project_id
    AND projects.condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage project quotes" ON project_quotes;
CREATE POLICY "Admins can manage project quotes" ON project_quotes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects 
    JOIN profiles ON profiles.condo_id = projects.condo_id
    WHERE projects.id = project_quotes.project_id
    AND profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- SURVEYS
-- =====================
DROP POLICY IF EXISTS "Users can view surveys in their condo" ON surveys;
CREATE POLICY "Users can view surveys in their condo" ON surveys
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage surveys" ON surveys;
CREATE POLICY "Admins can manage surveys" ON surveys
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = surveys.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- SURVEY_QUESTIONS
-- =====================
DROP POLICY IF EXISTS "Users can view survey questions" ON survey_questions;
CREATE POLICY "Users can view survey questions" ON survey_questions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM surveys 
    WHERE surveys.id = survey_questions.survey_id
    AND surveys.condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- SURVEY_RESPONSES
-- =====================
DROP POLICY IF EXISTS "Users can view survey responses" ON survey_responses;
CREATE POLICY "Users can view survey responses" ON survey_responses
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM surveys 
    WHERE surveys.id = survey_responses.survey_id
    AND surveys.condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- PAYMENT_PROOFS
-- =====================
DROP POLICY IF EXISTS "Users can view payment proofs in their condo" ON payment_proofs;
CREATE POLICY "Users can view payment proofs in their condo" ON payment_proofs
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Users can manage payment proofs" ON payment_proofs;
CREATE POLICY "Users can manage payment proofs" ON payment_proofs
FOR ALL TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.condo_id = payment_proofs.condo_id
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================
-- CONDOMINIUMS
-- =====================
DROP POLICY IF EXISTS "Users can view their condo" ON condominiums;
CREATE POLICY "Users can view their condo" ON condominiums
FOR SELECT TO authenticated
USING (
  id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Super admin can manage condominiums" ON condominiums;
CREATE POLICY "Super admin can manage condominiums" ON condominiums
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
