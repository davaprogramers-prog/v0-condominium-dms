-- Fix RLS policies for area_reservations table
-- The issue is that propietarios cannot see their own reservations

-- Drop existing policies
DROP POLICY IF EXISTS "reservations_owner_select" ON public.area_reservations;
DROP POLICY IF EXISTS "reservations_owner_insert" ON public.area_reservations;
DROP POLICY IF EXISTS "reservations_owner_update" ON public.area_reservations;
DROP POLICY IF EXISTS "reservations_owner_delete" ON public.area_reservations;
DROP POLICY IF EXISTS "reservations_admin_all" ON public.area_reservations;
DROP POLICY IF EXISTS "reservations_concierge_select" ON public.area_reservations;
DROP POLICY IF EXISTS "reservations_concierge_update" ON public.area_reservations;
DROP POLICY IF EXISTS "Super admin full access area_reservations" ON public.area_reservations;
DROP POLICY IF EXISTS "Admin manage condo area_reservations" ON public.area_reservations;
DROP POLICY IF EXISTS "Conserje view condo area_reservations" ON public.area_reservations;
DROP POLICY IF EXISTS "Conserje update condo area_reservations" ON public.area_reservations;
DROP POLICY IF EXISTS "Propietario view condo area_reservations" ON public.area_reservations;
DROP POLICY IF EXISTS "Propietario create own area_reservations" ON public.area_reservations;
DROP POLICY IF EXISTS "Propietario update own area_reservations" ON public.area_reservations;
DROP POLICY IF EXISTS "Propietario delete own area_reservations" ON public.area_reservations;

-- Super admin: full access
CREATE POLICY "super_admin_reservations" ON public.area_reservations
  FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');

-- Admin: full access to their condo
CREATE POLICY "admin_reservations" ON public.area_reservations
  FOR ALL USING (
    public.get_user_role(auth.uid()) = 'admin'
    AND condo_id = (SELECT condo_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
    AND condo_id = (SELECT condo_id FROM public.profiles WHERE id = auth.uid())
  );

-- Conserje: can view all and update reservations in their condo
CREATE POLICY "concierge_select_reservations" ON public.area_reservations
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'conserje'
    AND condo_id = (SELECT condo_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "concierge_update_reservations" ON public.area_reservations
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'conserje'
    AND condo_id = (SELECT condo_id FROM public.profiles WHERE id = auth.uid())
  );

-- Propietario: can view ALL reservations in their condo (to check availability)
CREATE POLICY "owner_select_all_reservations" ON public.area_reservations
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'propietario'
    AND condo_id = (SELECT condo_id FROM public.profiles WHERE id = auth.uid())
  );

-- Propietario: can create reservations for their own house
CREATE POLICY "owner_insert_reservations" ON public.area_reservations
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) = 'propietario'
    AND created_by = auth.uid()
    AND house_id = (SELECT house_id FROM public.profiles WHERE id = auth.uid())
  );

-- Propietario: can update their own reservations
CREATE POLICY "owner_update_reservations" ON public.area_reservations
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'propietario'
    AND house_id = (SELECT house_id FROM public.profiles WHERE id = auth.uid())
  );

-- Propietario: can delete their own reservations
CREATE POLICY "owner_delete_reservations" ON public.area_reservations
  FOR DELETE USING (
    public.get_user_role(auth.uid()) = 'propietario'
    AND house_id = (SELECT house_id FROM public.profiles WHERE id = auth.uid())
  );
