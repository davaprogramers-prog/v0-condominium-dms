-- 150: Super administrador de plataforma con registro global + AAL2.
-- Idempotente. Rollback: scripts/150_rollback.sql
-- No borra datos: los valores profiles.role = 'super_admin' se conservan pero ya no otorgan privilegios.

BEGIN;

-- ============================================================
-- 1. Tablas de plataforma (solo accesibles con la clave de servicio)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  email text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  creado_por uuid,
  creado_at timestamptz NOT NULL DEFAULT now(),
  motivo_alta text,
  desactivado_por uuid,
  desactivado_at timestamptz,
  motivo_baja text
);

CREATE TABLE IF NOT EXISTS public.platform_bootstrap (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  usado_por uuid NOT NULL,
  usado_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  accion text NOT NULL,
  resultado text NOT NULL CHECK (resultado IN ('concedido', 'denegado', 'error')),
  condo_id uuid,
  objetivo_user_id uuid,
  motivo text CHECK (motivo IS NULL OR length(motivo) <= 300),
  ip text
);
CREATE INDEX IF NOT EXISTS platform_audit_log_created_idx ON public.platform_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_log_actor_idx ON public.platform_audit_log (actor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.platform_mfa_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  usado_at timestamptz
);
CREATE INDEX IF NOT EXISTS platform_mfa_recovery_codes_user_idx ON public.platform_mfa_recovery_codes (user_id) WHERE usado_at IS NULL;

CREATE TABLE IF NOT EXISTS public.platform_reautenticaciones (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  confirmado_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_rate_limits (
  clave text PRIMARY KEY,
  intentos integer NOT NULL DEFAULT 0,
  ventana_inicio timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_policy_backup (
  schemaname text NOT NULL,
  tablename text NOT NULL,
  policyname text NOT NULL,
  qual text,
  with_check text,
  respaldado_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (schemaname, tablename, policyname)
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['platform_super_admins','platform_bootstrap','platform_audit_log',
    'platform_mfa_recovery_codes','platform_reautenticaciones','platform_rate_limits','platform_policy_backup']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated, public', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- El último super admin activo no puede desactivarse ni borrarse.
CREATE OR REPLACE FUNCTION public.fn_plataforma_proteger_ultimo()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.activo) OR (TG_OP = 'UPDATE' AND OLD.activo AND NOT NEW.activo) THEN
    PERFORM 1 FROM public.platform_super_admins FOR UPDATE;
    IF NOT EXISTS (SELECT 1 FROM public.platform_super_admins s WHERE s.activo AND s.user_id <> OLD.user_id) THEN
      RAISE EXCEPTION 'ULTIMO_SUPER_ADMIN' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_plataforma_proteger_ultimo ON public.platform_super_admins;
CREATE TRIGGER trg_plataforma_proteger_ultimo
  BEFORE UPDATE OR DELETE ON public.platform_super_admins
  FOR EACH ROW EXECUTE FUNCTION public.fn_plataforma_proteger_ultimo();

-- ============================================================
-- 2. Funciones de identidad usadas por RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_super_admins s
    WHERE s.user_id = auth.uid() AND s.activo
  ) AND coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE user_role text;
BEGIN
  SELECT p.role INTO user_role FROM public.profiles p WHERE p.id = auth.uid();
  IF user_role = 'super_admin' AND NOT public.is_super_admin() THEN
    RETURN 'guest';
  END IF;
  RETURN coalesce(user_role, 'guest');
END $$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE user_role text;
BEGIN
  SELECT p.role INTO user_role FROM public.profiles p WHERE p.id = user_id;
  IF user_role = 'super_admin' THEN
    IF user_id = auth.uid() THEN
      IF NOT public.is_super_admin() THEN RETURN 'guest'; END IF;
    ELSIF NOT EXISTS (SELECT 1 FROM public.platform_super_admins s WHERE s.user_id = get_user_role.user_id AND s.activo) THEN
      RETURN 'guest';
    END IF;
  END IF;
  RETURN coalesce(user_role, 'guest');
END $$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_super() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_super_admin(), public.get_my_role(), public.get_user_role(uuid), public.is_admin_or_super() TO authenticated, service_role;

-- ============================================================
-- 3. Funciones de servidor (solo service_role)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_plataforma_consumir_intento(p_clave text, p_max integer, p_ventana_seg integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v public.platform_rate_limits%ROWTYPE;
  ahora timestamptz := now();
BEGIN
  INSERT INTO public.platform_rate_limits (clave, intentos, ventana_inicio)
  VALUES (p_clave, 0, ahora) ON CONFLICT (clave) DO NOTHING;
  SELECT * INTO v FROM public.platform_rate_limits WHERE clave = p_clave FOR UPDATE;
  IF v.ventana_inicio + make_interval(secs => p_ventana_seg) <= ahora THEN
    v.intentos := 0;
    v.ventana_inicio := ahora;
  END IF;
  IF v.intentos >= p_max THEN
    RETURN greatest(1, ceil(extract(epoch FROM (v.ventana_inicio + make_interval(secs => p_ventana_seg) - ahora)))::integer);
  END IF;
  UPDATE public.platform_rate_limits SET intentos = v.intentos + 1, ventana_inicio = v.ventana_inicio WHERE clave = p_clave;
  RETURN 0;
END $$;

CREATE OR REPLACE FUNCTION public.fn_plataforma_reiniciar_intentos(p_clave text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  DELETE FROM public.platform_rate_limits WHERE clave = p_clave;
$$;

CREATE OR REPLACE FUNCTION public.fn_plataforma_cerrar_sesiones(p_user uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE n integer;
BEGIN
  DELETE FROM auth.sessions WHERE user_id = p_user;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.fn_plataforma_bootstrap(p_user uuid, p_email text, p_ip text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  LOCK TABLE public.platform_bootstrap IN EXCLUSIVE MODE;
  IF EXISTS (SELECT 1 FROM public.platform_bootstrap) OR EXISTS (SELECT 1 FROM public.platform_super_admins) THEN
    RAISE EXCEPTION 'BOOTSTRAP_USADO' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.platform_bootstrap (usado_por) VALUES (p_user);
  INSERT INTO public.platform_super_admins (user_id, email, creado_por, motivo_alta)
  VALUES (p_user, lower(p_email), p_user, 'Bootstrap inicial');
  INSERT INTO public.platform_audit_log (actor_id, accion, resultado, objetivo_user_id, motivo, ip)
  VALUES (p_user, 'bootstrap', 'concedido', p_user, 'Alta del primer super administrador', p_ip);
END $$;

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.fn_plataforma_consumir_intento(text, integer, integer)',
    'public.fn_plataforma_reiniciar_intentos(text)',
    'public.fn_plataforma_cerrar_sesiones(uuid)',
    'public.fn_plataforma_bootstrap(uuid, text, text)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, public', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

-- ============================================================
-- 4. Cierre de escaladas en profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  rol_inicial text := coalesce(NEW.raw_app_meta_data ->> 'role', 'owner');
BEGIN
  IF rol_inicial NOT IN ('owner', 'propietario', 'admin', 'conserje') THEN
    rol_inicial := 'owner';
  END IF;
  INSERT INTO public.profiles (id, email, role, first_name, last_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    rol_inicial,
    coalesce(NEW.raw_user_meta_data ->> 'first_name', ''),
    coalesce(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = coalesce(nullif(EXCLUDED.first_name, ''), public.profiles.first_name),
    last_name = coalesce(nullif(EXCLUDED.last_name, ''), public.profiles.last_name);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.fn_proteger_perfil()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  jwt_role text := coalesce(auth.jwt() ->> 'role', '');
  actor uuid := auth.uid();
  mi_rol text;
  mi_condo uuid;
  mi_email text;
BEGIN
  -- Servidor (clave de servicio), migraciones y triggers internos sin JWT de usuario.
  IF jwt_role = 'service_role' OR actor IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.role = 'super_admin' AND (TG_OP = 'INSERT' OR OLD.role IS DISTINCT FROM 'super_admin') THEN
    RAISE EXCEPTION 'ROL_NO_PERMITIDO' USING ERRCODE = '42501';
  END IF;

  SELECT p.role, p.condo_id, p.email INTO mi_rol, mi_condo, mi_email FROM public.profiles p WHERE p.id = actor;

  IF TG_OP = 'INSERT' THEN
    IF NEW.id = actor AND NEW.role NOT IN ('owner', 'propietario') THEN
      RAISE EXCEPTION 'ROL_NO_PERMITIDO' USING ERRCODE = '42501';
    END IF;
    IF NEW.id <> actor AND NOT public.is_super_admin()
       AND NOT (mi_rol = 'admin' AND NEW.condo_id = mi_condo AND NEW.role IN ('owner', 'propietario', 'conserje')) THEN
      RAISE EXCEPTION 'ROL_NO_PERMITIDO' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NEW.id = actor OR OLD.role = 'super_admin' THEN
      RAISE EXCEPTION 'ROL_NO_PERMITIDO' USING ERRCODE = '42501';
    END IF;
    IF NOT public.is_super_admin()
       AND NOT (mi_rol = 'admin' AND OLD.condo_id = mi_condo AND NEW.role IN ('owner', 'propietario', 'conserje')) THEN
      RAISE EXCEPTION 'ROL_NO_PERMITIDO' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.condo_id IS DISTINCT FROM OLD.condo_id AND NEW.condo_id IS NOT NULL AND NOT public.is_super_admin() THEN
    IF NEW.id = actor THEN
      IF NOT EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = NEW.condo_id AND c.created_by = actor)
         AND NOT EXISTS (
           SELECT 1 FROM public.houses h
           WHERE h.condo_id = NEW.condo_id
             AND (h.owner_user_id = actor OR (mi_email IS NOT NULL AND lower(h.owner_email) = lower(mi_email)))
         ) THEN
        RAISE EXCEPTION 'CONDOMINIO_NO_AUTORIZADO' USING ERRCODE = '42501';
      END IF;
    ELSIF NOT (mi_rol = 'admin' AND NEW.condo_id = mi_condo) THEN
      RAISE EXCEPTION 'CONDOMINIO_NO_AUTORIZADO' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.fn_proteger_perfil() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS trg_proteger_perfil ON public.profiles;
CREATE TRIGGER trg_proteger_perfil
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_proteger_perfil();

-- ============================================================
-- 5. Políticas RLS: toda comparación en línea con 'super_admin' pasa a is_super_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_plataforma_reescribir_expr(e text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE r text := e;
BEGIN
  IF r IS NULL THEN RETURN NULL; END IF;
  r := regexp_replace(r, 'EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+(public\.)?profiles\s+WHERE\s+\(\((profiles\.)?id\s*=\s*auth\.uid\(\)\)\s+AND\s+\((profiles\.)?role\s*=\s*''super_admin''::text\)\)\s*\)', 'is_super_admin()', 'gi');
  r := regexp_replace(r, 'EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+(public\.)?profiles\s+WHERE\s+\(\((profiles\.)?role\s*=\s*''super_admin''::text\)\s+AND\s+\((profiles\.)?id\s*=\s*auth\.uid\(\)\)\)\s*\)', 'is_super_admin()', 'gi');
  r := regexp_replace(r, 'get_my_role\(\)\s*=\s*''super_admin''::text', 'is_super_admin()', 'gi');
  r := regexp_replace(r, 'get_user_role\(auth\.uid\(\)\)\s*=\s*''super_admin''::text', 'is_super_admin()', 'gi');
  r := regexp_replace(r, '(\w+\.)?role\s*=\s*ANY\s*\(ARRAY\[''admin''::text,\s*''super_admin''::text\]\)', '\1role = ''admin''::text', 'gi');
  r := regexp_replace(r, '(\w+\.)?role\s*=\s*ANY\s*\(ARRAY\[''super_admin''::text,\s*''admin''::text\]\)', '\1role = ''admin''::text', 'gi');
  -- Listas que leen profiles.role directamente: se quita 'super_admin' (get_user_role/get_my_role ya están endurecidas).
  IF r ~ 'profiles' AND r ~ 'role' THEN
    r := regexp_replace(r, ',\s*''super_admin''::text', '', 'g');
    r := regexp_replace(r, '''super_admin''::text,\s*', '', 'g');
  END IF;
  RETURN r;
END $$;

DO $$
DECLARE
  pol record;
  nuevo_qual text;
  nuevo_check text;
  sentencia text;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND replace(coalesce(qual, '') || coalesce(with_check, ''), 'is_super_admin()', '') ~ 'super_admin'
  LOOP
    INSERT INTO public.platform_policy_backup (schemaname, tablename, policyname, qual, with_check)
    VALUES (pol.schemaname, pol.tablename, pol.policyname, pol.qual, pol.with_check)
    ON CONFLICT (schemaname, tablename, policyname) DO NOTHING;

    nuevo_qual := public.fn_plataforma_reescribir_expr(pol.qual);
    nuevo_check := public.fn_plataforma_reescribir_expr(pol.with_check);
    IF length(coalesce(nuevo_qual, '')) - length(replace(coalesce(nuevo_qual, ''), '(', ''))
       <> length(coalesce(nuevo_qual, '')) - length(replace(coalesce(nuevo_qual, ''), ')', ''))
       OR length(coalesce(nuevo_check, '')) - length(replace(coalesce(nuevo_check, ''), '(', ''))
       <> length(coalesce(nuevo_check, '')) - length(replace(coalesce(nuevo_check, ''), ')', '')) THEN
      RAISE EXCEPTION 'REESCRITURA_DESBALANCEADA %.%: % | %', pol.tablename, pol.policyname, nuevo_qual, nuevo_check;
    END IF;
    sentencia := format('ALTER POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    IF nuevo_qual IS NOT NULL THEN sentencia := sentencia || format(' USING (%s)', nuevo_qual); END IF;
    IF nuevo_check IS NOT NULL THEN sentencia := sentencia || format(' WITH CHECK (%s)', nuevo_check); END IF;
    EXECUTE sentencia;
  END LOOP;
END $$;

DROP FUNCTION public.fn_plataforma_reescribir_expr(text);

COMMIT;
