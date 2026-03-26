-- Fix RLS policies for super_admin access
-- Only includes tables that definitely exist

-- =============================================
-- PROFILES
-- =============================================
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read profiles in their condo" ON profiles;
DROP POLICY IF EXISTS "Super admin can read all profiles" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read profiles in their condo" ON profiles
FOR SELECT TO authenticated
USING (
  condo_id IN (
    SELECT p.condo_id FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admin can read all profiles" ON profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'super_admin'
  )
);

-- =============================================
-- CONDOMINIUMS
-- =============================================
DROP POLICY IF EXISTS "Users can read their condo" ON condominiums;
DROP POLICY IF EXISTS "Super admin can read all condos" ON condominiums;
DROP POLICY IF EXISTS "Super admin can create condominiums" ON condominiums;
DROP POLICY IF EXISTS "Super admin can update condominiums" ON condominiums;
DROP POLICY IF EXISTS "Super admin can delete condominiums" ON condominiums;

CREATE POLICY "Users can read their condo" ON condominiums
FOR SELECT TO authenticated
USING (
  id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Super admin can read all condos" ON condominiums
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Super admin can create condominiums" ON condominiums
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Super admin can update condominiums" ON condominiums
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Super admin can delete condominiums" ON condominiums
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =============================================
-- HOUSES
-- =============================================
DROP POLICY IF EXISTS "Users can read houses in their condo" ON houses;
DROP POLICY IF EXISTS "Admins can manage houses" ON houses;
DROP POLICY IF EXISTS "Super admin full access houses" ON houses;

CREATE POLICY "Users can read houses in their condo" ON houses
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can manage houses" ON houses
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admin full access houses" ON houses
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =============================================
-- CONDO_EXPENSES
-- =============================================
DROP POLICY IF EXISTS "Users can read expenses in their condo" ON condo_expenses;
DROP POLICY IF EXISTS "Admins can manage expenses" ON condo_expenses;
DROP POLICY IF EXISTS "Super admin full access expenses" ON condo_expenses;

CREATE POLICY "Users can read expenses in their condo" ON condo_expenses
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can manage expenses" ON condo_expenses
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admin full access expenses" ON condo_expenses
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =============================================
-- CONDO_INCOME
-- =============================================
DROP POLICY IF EXISTS "Users can read income in their condo" ON condo_income;
DROP POLICY IF EXISTS "Admins can manage income" ON condo_income;
DROP POLICY IF EXISTS "Super admin full access income" ON condo_income;

CREATE POLICY "Users can read income in their condo" ON condo_income
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can manage income" ON condo_income
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admin full access income" ON condo_income
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =============================================
-- EXPENSE_TYPES
-- =============================================
DROP POLICY IF EXISTS "Users can read expense types" ON expense_types;
DROP POLICY IF EXISTS "Admins can manage expense types" ON expense_types;
DROP POLICY IF EXISTS "Super admin full access expense types" ON expense_types;

CREATE POLICY "Users can read expense types" ON expense_types
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can manage expense types" ON expense_types
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admin full access expense types" ON expense_types
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =============================================
-- INFRACTIONS
-- =============================================
DROP POLICY IF EXISTS "Users can read infractions in their condo" ON infractions;
DROP POLICY IF EXISTS "Admins can manage infractions" ON infractions;
DROP POLICY IF EXISTS "Super admin full access infractions" ON infractions;

CREATE POLICY "Users can read infractions in their condo" ON infractions
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can manage infractions" ON infractions
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admin full access infractions" ON infractions
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =============================================
-- PAYMENT_PROOFS
-- =============================================
DROP POLICY IF EXISTS "Users can read proofs in their condo" ON payment_proofs;
DROP POLICY IF EXISTS "Admins can manage proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Super admin full access proofs" ON payment_proofs;

CREATE POLICY "Users can read proofs in their condo" ON payment_proofs
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Users can insert their own proofs" ON payment_proofs
FOR INSERT TO authenticated
WITH CHECK (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can manage proofs" ON payment_proofs
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admin full access proofs" ON payment_proofs
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =============================================
-- COMMON_AREAS
-- =============================================
DROP POLICY IF EXISTS "Users can read common areas" ON common_areas;
DROP POLICY IF EXISTS "Admins can manage common areas" ON common_areas;
DROP POLICY IF EXISTS "Super admin full access common areas" ON common_areas;

CREATE POLICY "Users can read common areas" ON common_areas
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can manage common areas" ON common_areas
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admin full access common areas" ON common_areas
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =============================================
-- DOCUMENTS
-- =============================================
DROP POLICY IF EXISTS "Users can read documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON documents;
DROP POLICY IF EXISTS "Super admin full access documents" ON documents;

CREATE POLICY "Users can read documents" ON documents
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can manage documents" ON documents
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admin full access documents" ON documents
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =============================================
-- EXONERATION_TYPES
-- =============================================
DROP POLICY IF EXISTS "Users can read exoneration types" ON exoneration_types;
DROP POLICY IF EXISTS "Admins can manage exoneration types" ON exoneration_types;
DROP POLICY IF EXISTS "Super admin full access exoneration types" ON exoneration_types;

CREATE POLICY "Users can read exoneration types" ON exoneration_types
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can manage exoneration types" ON exoneration_types
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admin full access exoneration types" ON exoneration_types
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =============================================
-- BALANCE_ADJUSTMENTS
-- =============================================
DROP POLICY IF EXISTS "Users can read balance adjustments" ON balance_adjustments;
DROP POLICY IF EXISTS "Admins can manage balance adjustments" ON balance_adjustments;
DROP POLICY IF EXISTS "Super admin full access balance adjustments" ON balance_adjustments;

CREATE POLICY "Users can read balance adjustments" ON balance_adjustments
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can manage balance adjustments" ON balance_adjustments
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admin full access balance adjustments" ON balance_adjustments
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);
