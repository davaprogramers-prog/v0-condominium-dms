-- Fix RLS policies for supply_requests table

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can create supply requests for their condo" ON public.supply_requests;
DROP POLICY IF EXISTS "supply_requests_create" ON public.supply_requests;
DROP POLICY IF EXISTS "Admins can manage supply requests" ON public.supply_requests;

-- Create a permissive policy for insert
CREATE POLICY "supply_requests_insert_policy" ON public.supply_requests
  FOR INSERT
  WITH CHECK (true);

-- Create a permissive policy for select
CREATE POLICY "supply_requests_select_policy" ON public.supply_requests
  FOR SELECT
  USING (true);

-- Create a permissive policy for update
CREATE POLICY "supply_requests_update_policy" ON public.supply_requests
  FOR UPDATE
  USING (true);

-- Create a permissive policy for delete
CREATE POLICY "supply_requests_delete_policy" ON public.supply_requests
  FOR DELETE
  USING (true);
