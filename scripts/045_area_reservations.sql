-- =====================================================
-- AREA RESERVATIONS SYSTEM
-- =====================================================

-- 1. Add reservation configuration columns to common_areas
ALTER TABLE public.common_areas ADD COLUMN IF NOT EXISTS is_reservable BOOLEAN DEFAULT true;
ALTER TABLE public.common_areas ADD COLUMN IF NOT EXISTS max_hours_per_reservation INTEGER DEFAULT 2;
ALTER TABLE public.common_areas ADD COLUMN IF NOT EXISTS reception_minutes INTEGER DEFAULT 30;
ALTER TABLE public.common_areas ADD COLUMN IF NOT EXISTS return_minutes INTEGER DEFAULT 30;
ALTER TABLE public.common_areas ADD COLUMN IF NOT EXISTS min_hours_to_modify INTEGER DEFAULT 12;
ALTER TABLE public.common_areas ADD COLUMN IF NOT EXISTS opening_hour TIME DEFAULT '08:00';
ALTER TABLE public.common_areas ADD COLUMN IF NOT EXISTS closing_hour TIME DEFAULT '22:00';

-- 2. Create area_reservations table
CREATE TABLE IF NOT EXISTS public.area_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_area_id UUID NOT NULL REFERENCES public.common_areas(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  
  -- Reservation date and time (what the owner requests)
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Actual time including reception and return (for conflict detection)
  actual_start_time TIME NOT NULL,
  actual_end_time TIME NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  
  -- Notes
  notes TEXT,
  
  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  modified_by UUID REFERENCES auth.users(id),
  modified_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_area_reservations_area_date ON public.area_reservations(common_area_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_area_reservations_house ON public.area_reservations(house_id);
CREATE INDEX IF NOT EXISTS idx_area_reservations_condo ON public.area_reservations(condo_id);
CREATE INDEX IF NOT EXISTS idx_area_reservations_status ON public.area_reservations(status);

-- 4. Enable RLS
ALTER TABLE public.area_reservations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Super admin full access
DROP POLICY IF EXISTS "reservations_superadmin" ON public.area_reservations;
CREATE POLICY "reservations_superadmin" ON public.area_reservations
  FOR ALL USING (
    public.get_user_role(auth.uid()) = 'super_admin'
  ) WITH CHECK (
    public.get_user_role(auth.uid()) = 'super_admin'
  );

-- Admin/Conserje can view all reservations in their condo
DROP POLICY IF EXISTS "reservations_admin_select" ON public.area_reservations;
CREATE POLICY "reservations_admin_select" ON public.area_reservations
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('admin', 'conserje') AND
    condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  );

-- Admin/Conserje can insert reservations
DROP POLICY IF EXISTS "reservations_admin_insert" ON public.area_reservations;
CREATE POLICY "reservations_admin_insert" ON public.area_reservations
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'conserje') AND
    condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  );

-- Admin/Conserje can update any reservation in their condo
DROP POLICY IF EXISTS "reservations_admin_update" ON public.area_reservations;
CREATE POLICY "reservations_admin_update" ON public.area_reservations
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) IN ('admin', 'conserje') AND
    condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  ) WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'conserje') AND
    condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  );

-- Propietarios can view reservations in their condo
DROP POLICY IF EXISTS "reservations_owner_select" ON public.area_reservations;
CREATE POLICY "reservations_owner_select" ON public.area_reservations
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'propietario' AND
    condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  );

-- Propietarios can create reservations for their own house
DROP POLICY IF EXISTS "reservations_owner_insert" ON public.area_reservations;
CREATE POLICY "reservations_owner_insert" ON public.area_reservations
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) = 'propietario' AND
    created_by = auth.uid() AND
    house_id IN (
      SELECT h.id FROM houses h
      JOIN profiles p ON p.id = auth.uid()
      WHERE h.owner_email = p.email OR h.id = p.house_id
    )
  );

-- Propietarios can update their own reservations (time limit checked in app)
DROP POLICY IF EXISTS "reservations_owner_update" ON public.area_reservations;
CREATE POLICY "reservations_owner_update" ON public.area_reservations
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'propietario' AND
    created_by = auth.uid() AND
    status = 'confirmed'
  ) WITH CHECK (
    public.get_user_role(auth.uid()) = 'propietario' AND
    created_by = auth.uid()
  );

-- 6. Function to check for overlapping reservations
CREATE OR REPLACE FUNCTION public.check_reservation_overlap(
  p_area_id UUID,
  p_date DATE,
  p_actual_start TIME,
  p_actual_end TIME,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  has_overlap BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.area_reservations
    WHERE common_area_id = p_area_id
      AND reservation_date = p_date
      AND status = 'confirmed'
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
      AND (
        (p_actual_start < actual_end_time AND p_actual_end > actual_start_time)
      )
  ) INTO has_overlap;
  
  RETURN has_overlap;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_reservation_overlap(UUID, DATE, TIME, TIME, UUID) TO authenticated;
