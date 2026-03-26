-- Fix RLS policies for core tables to include super_admin
-- Only includes tables confirmed to exist

-- ============================================
-- PROFILES
-- ============================================
DROP POLICY IF EXISTS "Users can view profiles in same condo" ON profiles;
DROP POLICY IF EXISTS "Super admin can view all profiles" ON profiles;

CREATE POLICY "Users can view profiles in same condo" ON profiles
FOR SELECT TO authenticated
USING (
  condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR id = auth.uid()
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- CONDOMINIUMS
-- ============================================
DROP POLICY IF EXISTS "Users can view their condo" ON condominiums;
DROP POLICY IF EXISTS "Super admin can view all condos" ON condominiums;

CREATE POLICY "Users can view condominiums" ON condominiums
FOR SELECT TO authenticated
USING (
  id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- HOUSES
-- ============================================
DROP POLICY IF EXISTS "Users can view houses in their condo" ON houses;
DROP POLICY IF EXISTS "Admins can manage houses" ON houses;

CREATE POLICY "Users can view houses in their condo" ON houses
FOR SELECT TO authenticated
USING (
  condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can manage houses" ON houses
FOR ALL TO authenticated
USING (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- CONDO_EXPENSES
-- ============================================
DROP POLICY IF EXISTS "Users can view expenses in their condo" ON condo_expenses;
DROP POLICY IF EXISTS "Admins can manage expenses" ON condo_expenses;

CREATE POLICY "Users can view expenses in their condo" ON condo_expenses
FOR SELECT TO authenticated
USING (
  condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can manage expenses" ON condo_expenses
FOR ALL TO authenticated
USING (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- CONDO_INCOME
-- ============================================
DROP POLICY IF EXISTS "Users can view income in their condo" ON condo_income;
DROP POLICY IF EXISTS "Admins can manage income" ON condo_income;

CREATE POLICY "Users can view income in their condo" ON condo_income
FOR SELECT TO authenticated
USING (
  condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can manage income" ON condo_income
FOR ALL TO authenticated
USING (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- EXPENSE_TYPES
-- ============================================
DROP POLICY IF EXISTS "Users can view expense types" ON expense_types;
DROP POLICY IF EXISTS "Admins can manage expense types" ON expense_types;

CREATE POLICY "Users can view expense types" ON expense_types
FOR SELECT TO authenticated
USING (
  condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can manage expense types" ON expense_types
FOR ALL TO authenticated
USING (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- INFRACTIONS
-- ============================================
DROP POLICY IF EXISTS "Users can view infractions" ON infractions;
DROP POLICY IF EXISTS "Admins can manage infractions" ON infractions;

CREATE POLICY "Users can view infractions" ON infractions
FOR SELECT TO authenticated
USING (
  condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can manage infractions" ON infractions
FOR ALL TO authenticated
USING (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- INFRACTION_TYPES  
-- ============================================
DROP POLICY IF EXISTS "Users can view infraction types" ON infraction_types;
DROP POLICY IF EXISTS "Admins can manage infraction types" ON infraction_types;

CREATE POLICY "Users can view infraction types" ON infraction_types
FOR SELECT TO authenticated
USING (
  condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can manage infraction types" ON infraction_types
FOR ALL TO authenticated
USING (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- PAYMENT_PROOFS
-- ============================================
DROP POLICY IF EXISTS "Users can view payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Admins can manage payment proofs" ON payment_proofs;

CREATE POLICY "Users can view payment proofs" ON payment_proofs
FOR SELECT TO authenticated
USING (
  condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can manage payment proofs" ON payment_proofs
FOR ALL TO authenticated
USING (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- COMMON_AREAS
-- ============================================
DROP POLICY IF EXISTS "Users can view common areas" ON common_areas;
DROP POLICY IF EXISTS "Admins can manage common areas" ON common_areas;

CREATE POLICY "Users can view common areas" ON common_areas
FOR SELECT TO authenticated
USING (
  condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can manage common areas" ON common_areas
FOR ALL TO authenticated
USING (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- DOCUMENTS
-- ============================================
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON documents;

CREATE POLICY "Users can view documents" ON documents
FOR SELECT TO authenticated
USING (
  condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can manage documents" ON documents
FOR ALL TO authenticated
USING (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- EXONERATION_TYPES
-- ============================================
DROP POLICY IF EXISTS "Users can view exoneration types" ON exoneration_types;
DROP POLICY IF EXISTS "Admins can manage exoneration types" ON exoneration_types;

CREATE POLICY "Users can view exoneration types" ON exoneration_types
FOR SELECT TO authenticated
USING (
  condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can manage exoneration types" ON exoneration_types
FOR ALL TO authenticated
USING (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- ============================================
-- BALANCE_ADJUSTMENTS
-- ============================================
DROP POLICY IF EXISTS "Users can view balance adjustments" ON balance_adjustments;
DROP POLICY IF EXISTS "Admins can manage balance adjustments" ON balance_adjustments;

CREATE POLICY "Users can view balance adjustments" ON balance_adjustments
FOR SELECT TO authenticated
USING (
  condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid())
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can manage balance adjustments" ON balance_adjustments
FOR ALL TO authenticated
USING (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (condo_id = (SELECT condo_id FROM profiles WHERE id = auth.uid()) 
   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);
