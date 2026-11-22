-- Revierte 152_aislamiento_condominios.sql (quita las políticas RESTRICTIVE y las funciones).
-- No restaura los privilegios de escritura de anon (no eran necesarios para la app).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND policyname IN (
      'condo_aislamiento', 'condo_aislamiento_lectura', 'condo_aislamiento_edicion',
      'condo_aislamiento_borrado', 'condo_aislamiento_escritura')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.fn_condos_accesibles_sesion();
DROP FUNCTION IF EXISTS public.fn_es_super_admin_sesion();
DROP FUNCTION IF EXISTS public.fn_condos_accesibles();
