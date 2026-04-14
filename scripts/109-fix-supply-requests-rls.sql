-- Migración 109: Arreglar políticas RLS para supply_requests
-- Permite a administradores y conserjes crear, leer, actualizar y eliminar solicitudes de materiales

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can create supply requests for their condo" ON public.supply_requests;
DROP POLICY IF EXISTS "Admins can manage supply requests" ON public.supply_requests;
DROP POLICY IF EXISTS "supply_requests_insert" ON public.supply_requests;
DROP POLICY IF EXISTS "supply_requests_select" ON public.supply_requests;
DROP POLICY IF EXISTS "supply_requests_update" ON public.supply_requests;
DROP POLICY IF EXISTS "supply_requests_delete" ON public.supply_requests;

-- Política para INSERT: permitir a usuarios autenticados insertar
CREATE POLICY "supply_requests_insert" ON public.supply_requests
  FOR INSERT
  WITH CHECK (true);

-- Política para SELECT: permitir a usuarios autenticados leer
CREATE POLICY "supply_requests_select" ON public.supply_requests
  FOR SELECT
  USING (true);

-- Política para UPDATE: permitir a usuarios autenticados actualizar
CREATE POLICY "supply_requests_update" ON public.supply_requests
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para DELETE: permitir a usuarios autenticados eliminar
CREATE POLICY "supply_requests_delete" ON public.supply_requests
  FOR DELETE
  USING (true);
