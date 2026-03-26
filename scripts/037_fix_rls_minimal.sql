-- Fix RLS policies for super_admin and admin access
-- Only includes tables that definitely exist

-- =====================================================
-- PROFILES
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view condo profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view condo profiles" ON profiles
FOR SELECT TO authenticated
USING (
  condo_id IN (
    SELECT p.condo_id FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'super_admin')
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'super_admin'
  )
);

-- =====================================================
-- CONDOMINIUMS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their condo" ON condominiums;
DROP POLICY IF EXISTS "Super admin can view all condos" ON condominiums;
DROP POLICY IF EXISTS "Super admin can create condominiums" ON condominiums;
DROP POLICY IF EXISTS "Super admin can update condominiums" ON condominiums;

CREATE POLICY "Users can view their condo" ON condominiums
FOR SELECT TO authenticated
USING (
  id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Super admin can view all condos" ON condominiums
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Super admin can create condominiums" ON condominiums
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Super admin can update condominiums" ON condominiums
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- =====================================================
-- HOUSES
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage houses" ON houses;
DROP POLICY IF EXISTS "Users can view condo houses" ON houses;

CREATE POLICY "Users can view condo houses" ON houses
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Admins can manage houses" ON houses
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =====================================================
-- CONDO_EXPENSES
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage expenses" ON condo_expenses;
DROP POLICY IF EXISTS "Users can view condo expenses" ON condo_expenses;

CREATE POLICY "Users can view condo expenses" ON condo_expenses
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Admins can manage expenses" ON condo_expenses
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =====================================================
-- CONDO_INCOME
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage income" ON condo_income;
DROP POLICY IF EXISTS "Users can view condo income" ON condo_income;

CREATE POLICY "Users can view condo income" ON condo_income
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Admins can manage income" ON condo_income
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =====================================================
-- EXPENSE_TYPES
-- =====================================================
DROP POLICY IF EXISTS "Users can view expense types" ON expense_types;
DROP POLICY IF EXISTS "Admins can manage expense types" ON expense_types;

CREATE POLICY "Users can view expense types" ON expense_types
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Admins can manage expense types" ON expense_types
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =====================================================
-- INFRACTIONS
-- =====================================================
DROP POLICY IF EXISTS "Users can view infractions" ON infractions;
DROP POLICY IF EXISTS "Admins can manage infractions" ON infractions;

CREATE POLICY "Users can view infractions" ON infractions
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Admins can manage infractions" ON infractions
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =====================================================
-- PAYMENT_PROOFS
-- =====================================================
DROP POLICY IF EXISTS "Users can view payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Admins can manage payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Users can insert payment proofs" ON payment_proofs;

CREATE POLICY "Users can view payment proofs" ON payment_proofs
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Users can insert payment proofs" ON payment_proofs
FOR INSERT TO authenticated
WITH CHECK (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can manage payment proofs" ON payment_proofs
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =====================================================
-- COMMON_AREAS
-- =====================================================
DROP POLICY IF EXISTS "Users can view common areas" ON common_areas;
DROP POLICY IF EXISTS "Admins can manage common areas" ON common_areas;

CREATE POLICY "Users can view common areas" ON common_areas
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Admins can manage common areas" ON common_areas
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =====================================================
-- DOCUMENTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON documents;

CREATE POLICY "Users can view documents" ON documents
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Admins can manage documents" ON documents
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =====================================================
-- EXEMPTION_TYPES
-- =====================================================
DROP POLICY IF EXISTS "Users can view exemption types" ON exemption_types;
DROP POLICY IF EXISTS "Admins can manage exemption types" ON exemption_types;

CREATE POLICY "Users can view exemption types" ON exemption_types
FOR SELECT TO authenticated
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE profiles.id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Admins can manage exemption types" ON exemption_types
FOR ALL TO authenticated
USING (
  condo_id IN (
    SELECT condo_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);
