-- 152: aislamiento entre condominios para TODOS los usuarios (no solo la demo).
-- Antes: ~25 tablas con SELECT USING (true) (incluso para anónimos) y escrituras de admin con
-- is_admin_or_super() sin mirar el condominio: un admin de A podía leer/editar/borrar datos de B.
--
-- Enfoque: políticas RESTRICTIVE (se suman con AND a las permisivas existentes, que no se tocan).
-- Una sesión solo ve/escribe filas de los condominios a los que pertenece:
--   * condominio de su perfil, o
--   * condominios donde es dueño de una casa (owner_user_id o owner_email = correo del JWT), o
--   * super admin efectivo (registro activo + AAL2, ver 150).
-- Anónimos: ninguna fila con condo_id. La clave de servicio no se ve afectada (salta RLS).
-- Idempotente. Revertir con scripts/152_rollback.sql.

-- 1. Condominios accesibles de la sesión (se evalúa una vez por consulta vía initplan) --------------
CREATE OR REPLACE FUNCTION public.fn_condos_accesibles() RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE(array_agg(DISTINCT x.condo_id), '{}'::uuid[])
  FROM (
    SELECT p.condo_id FROM public.profiles p WHERE p.id = auth.uid() AND p.condo_id IS NOT NULL
    UNION
    SELECT h.condo_id FROM public.houses h
    WHERE auth.uid() IS NOT NULL
      AND h.condo_id IS NOT NULL
      AND (h.owner_user_id = auth.uid()
           OR (h.owner_email IS NOT NULL AND lower(h.owner_email) = lower(auth.jwt() ->> 'email')))
  ) x
$$;
REVOKE ALL ON FUNCTION public.fn_condos_accesibles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_condos_accesibles() TO authenticated, service_role;

-- Para anónimos is_super_admin() no es ejecutable; esta envoltura devuelve false sin error.
CREATE OR REPLACE FUNCTION public.fn_es_super_admin_sesion() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND public.is_super_admin()
$$;
REVOKE ALL ON FUNCTION public.fn_es_super_admin_sesion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_es_super_admin_sesion() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.fn_condos_accesibles_sesion() RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN auth.uid() IS NULL THEN '{}'::uuid[] ELSE public.fn_condos_accesibles() END
$$;
REVOKE ALL ON FUNCTION public.fn_condos_accesibles_sesion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_condos_accesibles_sesion() TO anon, authenticated, service_role;

-- 2. Toda tabla con condo_id (salvo profiles, demo_* y platform_*) ----------------------------------
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables tb ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public' AND c.column_name = 'condo_id' AND tb.table_type = 'BASE TABLE'
      AND c.table_name <> 'profiles'
      AND c.table_name NOT LIKE 'demo\_%'
      AND c.table_name NOT LIKE 'platform\_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS condo_aislamiento ON public.%I', t);
    EXECUTE format($p$CREATE POLICY condo_aislamiento ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated
      USING ((SELECT public.fn_es_super_admin_sesion()) OR condo_id IN (SELECT unnest(public.fn_condos_accesibles_sesion())))
      WITH CHECK ((SELECT public.fn_es_super_admin_sesion()) OR condo_id IN (SELECT unnest(public.fn_condos_accesibles_sesion())))$p$, t);
  END LOOP;
END $$;

-- 3. Hijas sin condo_id: por la fila padre --------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('parcel_photos', 'parcel_id', 'parcels'),
    ('project_quotes', 'project_id', 'projects'),
    ('survey_options', 'survey_id', 'surveys'),
    ('survey_votes', 'survey_id', 'surveys')
  ) AS v (tabla, columna, padre)
  LOOP
    IF to_regclass('public.' || r.tabla) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('DROP POLICY IF EXISTS condo_aislamiento ON public.%I', r.tabla);
    EXECUTE format($p$CREATE POLICY condo_aislamiento ON public.%1$I AS RESTRICTIVE FOR ALL TO anon, authenticated
      USING ((SELECT public.fn_es_super_admin_sesion())
             OR %2$I IN (SELECT p.id FROM public.%3$I p WHERE p.condo_id IN (SELECT unnest(public.fn_condos_accesibles_sesion()))))
      WITH CHECK ((SELECT public.fn_es_super_admin_sesion())
             OR %2$I IN (SELECT p.id FROM public.%3$I p WHERE p.condo_id IN (SELECT unnest(public.fn_condos_accesibles_sesion()))))$p$,
      r.tabla, r.columna, r.padre);
  END LOOP;
END $$;

-- 4. condominiums: se lee/edita/borra solo el propio. El alta sigue en manos de las políticas existentes.
DROP POLICY IF EXISTS condo_aislamiento_lectura ON public.condominiums;
DROP POLICY IF EXISTS condo_aislamiento_edicion ON public.condominiums;
DROP POLICY IF EXISTS condo_aislamiento_borrado ON public.condominiums;
CREATE POLICY condo_aislamiento_lectura ON public.condominiums AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING ((SELECT public.fn_es_super_admin_sesion()) OR id IN (SELECT unnest(public.fn_condos_accesibles_sesion())));
CREATE POLICY condo_aislamiento_edicion ON public.condominiums AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING ((SELECT public.fn_es_super_admin_sesion()) OR id IN (SELECT unnest(public.fn_condos_accesibles_sesion())))
  WITH CHECK ((SELECT public.fn_es_super_admin_sesion()) OR id IN (SELECT unnest(public.fn_condos_accesibles_sesion())));
CREATE POLICY condo_aislamiento_borrado ON public.condominiums AS RESTRICTIVE FOR DELETE TO anon, authenticated
  USING ((SELECT public.fn_es_super_admin_sesion()));

-- 5. profiles: el propio siempre; los demás solo si son de un condominio accesible.
--    Las escrituras siguen protegidas por las políticas existentes y el trigger fn_proteger_perfil (150).
DROP POLICY IF EXISTS condo_aislamiento_lectura ON public.profiles;
DROP POLICY IF EXISTS condo_aislamiento_escritura ON public.profiles;
CREATE POLICY condo_aislamiento_lectura ON public.profiles AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (id = auth.uid() OR (SELECT public.fn_es_super_admin_sesion())
         OR condo_id IN (SELECT unnest(public.fn_condos_accesibles_sesion())));
CREATE POLICY condo_aislamiento_escritura ON public.profiles AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (id = auth.uid() OR (SELECT public.fn_es_super_admin_sesion())
         OR condo_id IN (SELECT unnest(public.fn_condos_accesibles_sesion())))
  WITH CHECK (id = auth.uid() OR (SELECT public.fn_es_super_admin_sesion())
         OR condo_id IN (SELECT unnest(public.fn_condos_accesibles_sesion())));

-- 6. Anónimos: sin escritura en tablas de negocio (antes algunas permisivas incluían el rol public).
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    AND tablename NOT LIKE 'demo\_%' AND tablename NOT LIKE 'platform\_%'
  LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon', t);
  END LOOP;
END $$;
