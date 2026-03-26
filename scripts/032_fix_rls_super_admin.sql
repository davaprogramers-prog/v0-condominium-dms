-- Fix RLS policies to include super_admin alongside admin
-- This script updates all relevant policies to allow super_admin access

-- Helper: Most policies check for admin role, we need to also allow super_admin

-- =====================================================
-- CONDO_EXPENSES
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage condo expenses" ON condo_expenses;
DROP POLICY IF EXISTS "Users can view their condo expenses" ON condo_expenses;
DROP POLICY IF EXISTS "Super admin can read all expenses" ON condo_expenses;

CREATE POLICY "Users can view their condo expenses" ON condo_expenses
FOR SELECT TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Admin can manage condo expenses" ON condo_expenses
FOR ALL TO authenticated
USING (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- CONDO_INCOME
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage condo income" ON condo_income;
DROP POLICY IF EXISTS "Users can view their condo income" ON condo_income;
DROP POLICY IF EXISTS "Super admin can read all income" ON condo_income;

CREATE POLICY "Users can view their condo income" ON condo_income
FOR SELECT TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Admin can manage condo income" ON condo_income
FOR ALL TO authenticated
USING (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- HOUSES
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage houses" ON houses;
DROP POLICY IF EXISTS "Users can view their condo houses" ON houses;

CREATE POLICY "Users can view their condo houses" ON houses
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admin can manage houses" ON houses
FOR ALL TO authenticated
USING (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- PROFILES
-- =====================================================
DROP POLICY IF EXISTS "Admin can view condo profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can manage condo profiles" ON profiles;

CREATE POLICY "Admin can view condo profiles" ON profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admin can manage condo profiles" ON profiles
FOR ALL TO authenticated
USING (
  id = auth.uid()
  OR
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  id = auth.uid()
  OR
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- INFRACTIONS
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage infractions" ON infractions;
DROP POLICY IF EXISTS "Users can view their condo infractions" ON infractions;

CREATE POLICY "Users can view their condo infractions" ON infractions
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admin can manage infractions" ON infractions
FOR ALL TO authenticated
USING (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- COMMON_AREAS
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage common areas" ON common_areas;
DROP POLICY IF EXISTS "Users can view their condo common areas" ON common_areas;

CREATE POLICY "Users can view their condo common areas" ON common_areas
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admin can manage common areas" ON common_areas
FOR ALL TO authenticated
USING (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- EXPENSE_TYPES
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage expense types" ON expense_types;
DROP POLICY IF EXISTS "Users can view their condo expense types" ON expense_types;

CREATE POLICY "Users can view their condo expense types" ON expense_types
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admin can manage expense types" ON expense_types
FOR ALL TO authenticated
USING (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- DOCUMENTS
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage documents" ON documents;
DROP POLICY IF EXISTS "Users can view their condo documents" ON documents;

CREATE POLICY "Users can view their condo documents" ON documents
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admin can manage documents" ON documents
FOR ALL TO authenticated
USING (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- ANNOUNCEMENTS
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Users can view their condo announcements" ON announcements;

CREATE POLICY "Users can view their condo announcements" ON announcements
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admin can manage announcements" ON announcements
FOR ALL TO authenticated
USING (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- PAYMENT_PROOFS
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Users can view their condo payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Users can submit payment proofs" ON payment_proofs;

CREATE POLICY "Users can view their condo payment proofs" ON payment_proofs
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can submit payment proofs" ON payment_proofs
FOR INSERT TO authenticated
WITH CHECK (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admin can manage payment proofs" ON payment_proofs
FOR ALL TO authenticated
USING (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- PROJECTS
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage projects" ON projects;
DROP POLICY IF EXISTS "Users can view their condo projects" ON projects;

CREATE POLICY "Users can view their condo projects" ON projects
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admin can manage projects" ON projects
FOR ALL TO authenticated
USING (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- PROJECT_QUOTES
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage project quotes" ON project_quotes;
DROP POLICY IF EXISTS "Users can view their condo project quotes" ON project_quotes;

CREATE POLICY "Users can view their condo project quotes" ON project_quotes
FOR SELECT TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  )
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admin can manage project quotes" ON project_quotes
FOR ALL TO authenticated
USING (
  (project_id IN (SELECT id FROM projects WHERE condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid()))
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  (project_id IN (SELECT id FROM projects WHERE condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid()))
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- EXEMPTION_TYPES
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage exemption types" ON exemption_types;
DROP POLICY IF EXISTS "Users can view their condo exemption types" ON exemption_types;

CREATE POLICY "Users can view their condo exemption types" ON exemption_types
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admin can manage exemption types" ON exemption_types
FOR ALL TO authenticated
USING (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
   AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- CONDOMINIUMS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their condominium" ON condominiums;
DROP POLICY IF EXISTS "Super admin can create condominiums" ON condominiums;
DROP POLICY IF EXISTS "Super admin can update condominiums" ON condominiums;
DROP POLICY IF EXISTS "Super admin can delete condominiums" ON condominiums;

CREATE POLICY "Users can view their condominium" ON condominiums
FOR SELECT TO authenticated
USING (
  id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Super admin can manage condominiums" ON condominiums
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
