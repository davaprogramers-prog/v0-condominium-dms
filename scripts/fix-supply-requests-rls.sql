-- Fix RLS policies for supply_requests table
-- Allow admins and staff (conserjes) to manage supply requests

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "supply_requests_select" ON public.supply_requests;
DROP POLICY IF EXISTS "supply_requests_insert" ON public.supply_requests;
DROP POLICY IF EXISTS "supply_requests_update" ON public.supply_requests;
DROP POLICY IF EXISTS "supply_requests_delete" ON public.supply_requests;

-- Allow everyone to select supply requests
CREATE POLICY "supply_requests_select" ON public.supply_requests FOR SELECT USING (true);

-- Allow admins and conserjes to create supply requests
CREATE POLICY "supply_requests_insert" ON public.supply_requests FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_condos uc
    JOIN public.profiles p ON p.id = uc.user_id
    WHERE uc.condo_id = supply_requests.condo_id 
    AND p.id = auth.uid()
    AND p.role IN ('admin', 'super_admin', 'conserje')
  )
);

-- Allow admins and conserjes to update supply requests
CREATE POLICY "supply_requests_update" ON public.supply_requests FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_condos uc
    JOIN public.profiles p ON p.id = uc.user_id
    WHERE uc.condo_id = supply_requests.condo_id 
    AND p.id = auth.uid()
    AND p.role IN ('admin', 'super_admin', 'conserje')
  )
);

-- Allow admins and conserjes to delete supply requests
CREATE POLICY "supply_requests_delete" ON public.supply_requests FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_condos uc
    JOIN public.profiles p ON p.id = uc.user_id
    WHERE uc.condo_id = supply_requests.condo_id 
    AND p.id = auth.uid()
    AND p.role IN ('admin', 'super_admin', 'conserje')
  )
);
