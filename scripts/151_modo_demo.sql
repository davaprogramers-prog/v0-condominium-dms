-- 151 · Modo demostración aislado.
-- Identidades temporales reales (auth.users) en UN condominio marcado es_demo.
-- Aislamiento: políticas RESTRICTIVE que solo afectan sesiones con app_metadata.demo = true;
-- no cambian nada para usuarios reales. Todo se ejecuta en una transacción.

BEGIN;

-- 1. Condominio demo (único) -------------------------------------------------
ALTER TABLE public.condominiums ADD COLUMN IF NOT EXISTS es_demo boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS condominiums_un_solo_demo ON public.condominiums ((true)) WHERE es_demo;

-- 2. Configuración (una fila; único lugar de los límites) --------------------
CREATE TABLE IF NOT EXISTS public.demo_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  duracion_horas integer NOT NULL DEFAULT 12 CHECK (duracion_horas BETWEEN 1 AND 48),
  max_activas integer NOT NULL DEFAULT 150 CHECK (max_activas BETWEEN 1 AND 5000),
  max_nuevas_por_ip_hora integer NOT NULL DEFAULT 10 CHECK (max_nuevas_por_ip_hora BETWEEN 1 AND 1000),
  inactividad_reciclaje_horas integer NOT NULL DEFAULT 24 CHECK (inactividad_reciclaje_horas >= 1),
  actualizado_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.demo_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 3. Identidades y eventos ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.demo_identidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  condo_id uuid NOT NULL REFERENCES public.condominiums (id) ON DELETE CASCADE,
  house_id uuid REFERENCES public.houses (id) ON DELETE SET NULL,
  rol text NOT NULL CHECK (rol IN ('admin', 'conserje', 'propietario')),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'activa', 'libre')),
  token_hash text UNIQUE CHECK (token_hash IS NULL OR token_hash ~ '^[0-9a-f]{64}$'),
  asignada_at timestamptz,
  expira_at timestamptz,
  ultima_actividad_at timestamptz NOT NULL DEFAULT now(),
  veces_asignada integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (estado <> 'activa' OR (user_id IS NOT NULL AND token_hash IS NOT NULL AND expira_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS demo_identidades_reciclaje ON public.demo_identidades (rol, estado, ultima_actividad_at);

CREATE TABLE IF NOT EXISTS public.demo_eventos (
  id bigserial PRIMARY KEY,
  identidad_id uuid REFERENCES public.demo_identidades (id) ON DELETE SET NULL,
  rol text,
  evento text NOT NULL CHECK (evento IN (
    'creada', 'reciclada', 'reanudada', 'salida', 'expirada', 'rechazo_ip', 'rechazo_cupo', 'error'
  )),
  -- HMAC de la IP calculado en el servidor; nunca la IP en claro. Se borra a las 48 h.
  huella_ip text CHECK (huella_ip IS NULL OR huella_ip ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS demo_eventos_ip ON public.demo_eventos (huella_ip, created_at) WHERE evento = 'creada';
CREATE INDEX IF NOT EXISTS demo_eventos_fecha ON public.demo_eventos (created_at);

ALTER TABLE public.demo_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_identidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_eventos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.demo_config, public.demo_identidades, public.demo_eventos FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.demo_eventos_id_seq FROM anon, authenticated;

-- 4. Funciones de sesión (las usan las políticas) ----------------------------
CREATE OR REPLACE FUNCTION public.es_sesion_demo() RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'demo') = 'true', false)
$$;

-- Condominio permitido para la sesión demo vigente; NULL si venció o fue liberada.
CREATE OR REPLACE FUNCTION public.demo_condo_vigente() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT d.condo_id FROM public.demo_identidades d
  WHERE d.user_id = auth.uid() AND d.estado = 'activa' AND d.expira_at > now()
$$;
REVOKE ALL ON FUNCTION public.demo_condo_vigente() FROM anon;

-- 5. Limpieza de datos del visitante anterior (solo dentro del condominio demo)
CREATE OR REPLACE FUNCTION public.fn_demo_limpiar_usuario(p_user uuid, p_condo uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  r record;
  n integer := 0;
  m integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.condominiums WHERE id = p_condo AND es_demo) THEN
    RAISE EXCEPTION 'CONDOMINIO_NO_DEMO';
  END IF;
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name IN ('created_by', 'uploaded_by', 'user_id', 'concierge_id', 'created_by_user_id')
      AND c.table_name NOT LIKE 'platform\_%' AND c.table_name NOT LIKE 'demo\_%'
      AND c.table_name <> 'profiles'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns x
        WHERE x.table_schema = 'public' AND x.table_name = c.table_name AND x.column_name = 'condo_id'
      )
  LOOP
    BEGIN
      EXECUTE format('DELETE FROM public.%I WHERE condo_id = $1 AND %I = $2', r.table_name, r.column_name)
        USING p_condo, p_user;
      GET DIAGNOSTICS m = ROW_COUNT;
      n := n + m;
    EXCEPTION WHEN foreign_key_violation THEN
      NULL; -- filas referenciadas por datos de otros: se conservan
    END;
  END LOOP;
  DELETE FROM public.survey_votes v USING public.surveys s
   WHERE v.voter_id = p_user AND s.id = v.survey_id AND s.condo_id = p_condo;
  UPDATE public.profiles SET avatar_url = NULL, phone = NULL WHERE id = p_user;
  RETURN n;
END $$;

-- 6. Reserva atómica (reanudación se hace aparte) -----------------------------
CREATE OR REPLACE FUNCTION public.fn_demo_reservar(p_rol text, p_huella text, p_token_hash text)
RETURNS TABLE (resultado text, identidad_id uuid, user_id uuid, house_id uuid, condo_id uuid, expira_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  cfg public.demo_config;
  v_condo uuid;
  v_id uuid;
  v_user uuid;
  v_house uuid;
  v_exp timestamptz;
  v_activas integer;
  v_nuevas integer;
BEGIN
  IF p_rol NOT IN ('admin', 'conserje', 'propietario') THEN RAISE EXCEPTION 'ROL_INVALIDO'; END IF;
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'TOKEN_INVALIDO'; END IF;
  IF p_huella IS NULL OR p_huella !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'HUELLA_INVALIDA'; END IF;

  -- Serializa reservas: cupo, límite por IP y reciclaje no admiten carreras.
  PERFORM pg_advisory_xact_lock(hashtext('fn_demo_reservar'));

  SELECT * INTO cfg FROM public.demo_config WHERE id = 1;
  SELECT c.id INTO v_condo FROM public.condominiums c WHERE c.es_demo;
  IF v_condo IS NULL THEN
    RETURN QUERY SELECT 'sin_demo'::text, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid, NULL::timestamptz;
    RETURN;
  END IF;
  v_exp := now() + make_interval(hours => cfg.duracion_horas);

  -- Vencidas: se liberan y se cierran sus sesiones.
  WITH vencidas AS (
    UPDATE public.demo_identidades d SET estado = 'libre', token_hash = NULL
    WHERE d.estado = 'activa' AND d.expira_at <= now()
    RETURNING d.id, d.user_id, d.rol
  ), sesiones AS (
    DELETE FROM auth.sessions s USING vencidas v WHERE s.user_id = v.user_id
  )
  INSERT INTO public.demo_eventos (identidad_id, rol, evento) SELECT v.id, v.rol, 'expirada' FROM vencidas v;

  -- Reservas cuyo alta en Auth nunca terminó.
  DELETE FROM public.demo_identidades d
   WHERE d.estado = 'pendiente' AND d.created_at < now() - interval '10 minutes';
  -- Huellas de IP: solo 48 h.
  UPDATE public.demo_eventos e SET huella_ip = NULL
   WHERE e.huella_ip IS NOT NULL AND e.created_at < now() - interval '48 hours';

  SELECT count(*) INTO v_activas FROM public.demo_identidades d WHERE d.estado IN ('activa', 'pendiente');
  IF v_activas >= cfg.max_activas THEN
    INSERT INTO public.demo_eventos (rol, evento, huella_ip) VALUES (p_rol, 'rechazo_cupo', p_huella);
    RETURN QUERY SELECT 'cupo'::text, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid, NULL::timestamptz;
    RETURN;
  END IF;

  -- Reciclaje: la identidad libre más antigua del rol, inactiva el tiempo configurado.
  SELECT d.id, d.user_id, d.house_id INTO v_id, v_user, v_house
  FROM public.demo_identidades d
  WHERE d.rol = p_rol AND d.estado = 'libre' AND d.user_id IS NOT NULL AND d.condo_id = v_condo
    AND d.ultima_actividad_at < now() - make_interval(hours => cfg.inactividad_reciclaje_horas)
  ORDER BY d.ultima_actividad_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_id IS NOT NULL THEN
    DELETE FROM auth.sessions s WHERE s.user_id = v_user;
    PERFORM public.fn_demo_limpiar_usuario(v_user, v_condo);
    UPDATE public.demo_identidades d
       SET estado = 'activa', token_hash = p_token_hash, asignada_at = now(), expira_at = v_exp,
           ultima_actividad_at = now(), veces_asignada = d.veces_asignada + 1
     WHERE d.id = v_id;
    INSERT INTO public.demo_eventos (identidad_id, rol, evento, huella_ip) VALUES (v_id, p_rol, 'reciclada', p_huella);
    RETURN QUERY SELECT 'reciclada'::text, v_id, v_user, v_house, v_condo, v_exp;
    RETURN;
  END IF;

  SELECT count(*) INTO v_nuevas FROM public.demo_eventos e
   WHERE e.evento = 'creada' AND e.huella_ip = p_huella AND e.created_at > now() - interval '1 hour';
  IF v_nuevas >= cfg.max_nuevas_por_ip_hora THEN
    INSERT INTO public.demo_eventos (rol, evento, huella_ip) VALUES (p_rol, 'rechazo_ip', p_huella);
    RETURN QUERY SELECT 'limite_ip'::text, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid, NULL::timestamptz;
    RETURN;
  END IF;

  IF p_rol = 'propietario' THEN
    SELECT h.id INTO v_house FROM public.houses h
    WHERE h.condo_id = v_condo AND coalesce(h.is_active, true)
    ORDER BY (SELECT count(*) FROM public.demo_identidades d WHERE d.house_id = h.id AND d.estado <> 'libre'), random()
    LIMIT 1;
  END IF;

  INSERT INTO public.demo_identidades (condo_id, house_id, rol, estado, token_hash, asignada_at, expira_at, veces_asignada)
  VALUES (v_condo, v_house, p_rol, 'pendiente', p_token_hash, now(), v_exp, 1)
  RETURNING id INTO v_id;
  INSERT INTO public.demo_eventos (identidad_id, rol, evento, huella_ip) VALUES (v_id, p_rol, 'creada', p_huella);
  RETURN QUERY SELECT 'crear'::text, v_id, NULL::uuid, v_house, v_condo, v_exp;
END $$;

CREATE OR REPLACE FUNCTION public.fn_demo_activar(p_identidad uuid, p_user uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.demo_identidades SET user_id = p_user, estado = 'activa', ultima_actividad_at = now()
   WHERE id = p_identidad AND estado = 'pendiente' AND user_id IS NULL;
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.fn_demo_descartar(p_identidad uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  DELETE FROM public.demo_identidades WHERE id = p_identidad AND estado = 'pendiente';
$$;

-- Reanuda con el token de la cookie y lo rota (uso único).
CREATE OR REPLACE FUNCTION public.fn_demo_reanudar(p_token_hash text, p_rol text, p_nuevo_hash text)
RETURNS TABLE (resultado text, identidad_id uuid, user_id uuid, expira_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE d public.demo_identidades;
BEGIN
  IF p_nuevo_hash IS NULL OR p_nuevo_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'TOKEN_INVALIDO'; END IF;
  SELECT * INTO d FROM public.demo_identidades x WHERE x.token_hash = p_token_hash FOR UPDATE;
  IF d.id IS NULL OR d.estado <> 'activa' OR d.expira_at <= now() THEN
    RETURN QUERY SELECT 'no_valida'::text, NULL::uuid, NULL::uuid, NULL::timestamptz;
    RETURN;
  END IF;
  IF d.rol <> p_rol THEN
    RETURN QUERY SELECT 'otro_rol'::text, d.id, d.user_id, d.expira_at;
    RETURN;
  END IF;
  UPDATE public.demo_identidades SET token_hash = p_nuevo_hash, ultima_actividad_at = now() WHERE id = d.id;
  INSERT INTO public.demo_eventos (identidad_id, rol, evento) VALUES (d.id, d.rol, 'reanudada');
  RETURN QUERY SELECT 'reanudada'::text, d.id, d.user_id, d.expira_at;
END $$;

-- Salida voluntaria o cambio de rol: revoca sesiones y deja la identidad libre.
CREATE OR REPLACE FUNCTION public.fn_demo_liberar(p_user uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid; v_rol text;
BEGIN
  UPDATE public.demo_identidades SET estado = 'libre', token_hash = NULL, expira_at = now()
   WHERE user_id = p_user AND estado = 'activa'
  RETURNING id, rol INTO v_id, v_rol;
  DELETE FROM auth.sessions WHERE user_id = p_user;
  IF v_id IS NOT NULL THEN
    INSERT INTO public.demo_eventos (identidad_id, rol, evento) VALUES (v_id, v_rol, 'salida');
  END IF;
  RETURN v_id IS NOT NULL;
END $$;

-- Vigencia + actividad (middleware). Al vencer, cierra sesiones en el acto.
CREATE OR REPLACE FUNCTION public.fn_demo_tocar(p_user uuid) RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE d public.demo_identidades;
BEGIN
  SELECT * INTO d FROM public.demo_identidades WHERE user_id = p_user;
  IF d.id IS NULL OR d.estado <> 'activa' THEN
    DELETE FROM auth.sessions WHERE user_id = p_user;
    RETURN NULL;
  END IF;
  IF d.expira_at <= now() THEN
    UPDATE public.demo_identidades SET estado = 'libre', token_hash = NULL WHERE id = d.id AND estado = 'activa';
    DELETE FROM auth.sessions WHERE user_id = p_user;
    INSERT INTO public.demo_eventos (identidad_id, rol, evento) VALUES (d.id, d.rol, 'expirada');
    RETURN NULL;
  END IF;
  IF d.ultima_actividad_at < now() - interval '2 minutes' THEN
    UPDATE public.demo_identidades SET ultima_actividad_at = now() WHERE id = d.id;
  END IF;
  RETURN d.expira_at;
END $$;

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'fn_demo_limpiar_usuario(uuid,uuid)', 'fn_demo_reservar(text,text,text)', 'fn_demo_activar(uuid,uuid)',
    'fn_demo_descartar(uuid)', 'fn_demo_reanudar(text,text,text)', 'fn_demo_liberar(uuid)', 'fn_demo_tocar(uuid)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', f);
  END LOOP;
END $$;

-- 7. Políticas RESTRICTIVE: solo afectan sesiones demo ------------------------
DO $$
DECLARE t text;
BEGIN
  -- Toda tabla con condo_id: lectura y escritura solo en el condominio demo vigente; sin borrados.
  FOR t IN
    SELECT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables tb ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public' AND c.column_name = 'condo_id' AND tb.table_type = 'BASE TABLE'
      AND c.table_name NOT LIKE 'demo\_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS demo_aislamiento ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS demo_sin_borrar ON public.%I', t);
    EXECUTE format($p$CREATE POLICY demo_aislamiento ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
      USING (NOT (SELECT public.es_sesion_demo()) OR condo_id = (SELECT public.demo_condo_vigente()))
      WITH CHECK (NOT (SELECT public.es_sesion_demo()) OR condo_id = (SELECT public.demo_condo_vigente()))$p$, t);
    EXECUTE format($p$CREATE POLICY demo_sin_borrar ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated
      USING (NOT (SELECT public.es_sesion_demo()))$p$, t);
  END LOOP;

  -- Configuración sensible: la demo solo la lee.
  FOR t IN SELECT unnest(ARRAY['condominium_themes', 'parameters', 'bank_statements']) LOOP
    EXECUTE format('DROP POLICY IF EXISTS demo_solo_lectura_ins ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS demo_solo_lectura_upd ON public.%I', t);
    EXECUTE format($p$CREATE POLICY demo_solo_lectura_ins ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated
      WITH CHECK (NOT (SELECT public.es_sesion_demo()))$p$, t);
    EXECUTE format($p$CREATE POLICY demo_solo_lectura_upd ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated
      USING (NOT (SELECT public.es_sesion_demo()))$p$, t);
  END LOOP;

  -- Tablas sin condo_id y globales: sin acceso o solo lectura para la demo.
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'platform\_%' LOOP
    EXECUTE format('DROP POLICY IF EXISTS demo_sin_acceso ON public.%I', t);
    EXECUTE format($p$CREATE POLICY demo_sin_acceso ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
      USING (NOT (SELECT public.es_sesion_demo())) WITH CHECK (NOT (SELECT public.es_sesion_demo()))$p$, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS demo_aislamiento ON public.condominiums;
DROP POLICY IF EXISTS demo_solo_lectura_ins ON public.condominiums;
DROP POLICY IF EXISTS demo_solo_lectura_upd ON public.condominiums;
DROP POLICY IF EXISTS demo_sin_borrar ON public.condominiums;
CREATE POLICY demo_aislamiento ON public.condominiums AS RESTRICTIVE FOR SELECT TO authenticated
  USING (NOT (SELECT public.es_sesion_demo()) OR id = (SELECT public.demo_condo_vigente()));
CREATE POLICY demo_solo_lectura_ins ON public.condominiums AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (NOT (SELECT public.es_sesion_demo()));
CREATE POLICY demo_solo_lectura_upd ON public.condominiums AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (NOT (SELECT public.es_sesion_demo()));
CREATE POLICY demo_sin_borrar ON public.condominiums AS RESTRICTIVE FOR DELETE TO authenticated
  USING (NOT (SELECT public.es_sesion_demo()));

-- Perfiles: la demo ve los del condominio demo y solo edita el propio.
DROP POLICY IF EXISTS demo_perfil_lectura ON public.profiles;
DROP POLICY IF EXISTS demo_perfil_alta ON public.profiles;
DROP POLICY IF EXISTS demo_perfil_edicion ON public.profiles;
CREATE POLICY demo_perfil_lectura ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated
  USING (NOT (SELECT public.es_sesion_demo()) OR id = auth.uid() OR condo_id = (SELECT public.demo_condo_vigente()));
CREATE POLICY demo_perfil_alta ON public.profiles AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (NOT (SELECT public.es_sesion_demo()));
CREATE POLICY demo_perfil_edicion ON public.profiles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (NOT (SELECT public.es_sesion_demo()) OR id = auth.uid())
  WITH CHECK (NOT (SELECT public.es_sesion_demo()) OR id = auth.uid());

-- Hijas sin condo_id: se aíslan por la fila padre.
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
    EXECUTE format('DROP POLICY IF EXISTS demo_aislamiento ON public.%I', r.tabla);
    EXECUTE format('DROP POLICY IF EXISTS demo_sin_borrar ON public.%I', r.tabla);
    EXECUTE format($p$CREATE POLICY demo_aislamiento ON public.%1$I AS RESTRICTIVE FOR ALL TO authenticated
      USING (NOT (SELECT public.es_sesion_demo())
             OR %2$I IN (SELECT p.id FROM public.%3$I p WHERE p.condo_id = (SELECT public.demo_condo_vigente())))
      WITH CHECK (NOT (SELECT public.es_sesion_demo())
             OR %2$I IN (SELECT p.id FROM public.%3$I p WHERE p.condo_id = (SELECT public.demo_condo_vigente())))$p$,
      r.tabla, r.columna, r.padre);
    EXECUTE format($p$CREATE POLICY demo_sin_borrar ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated
      USING (NOT (SELECT public.es_sesion_demo()))$p$, r.tabla);
  END LOOP;
END $$;

DROP POLICY IF EXISTS demo_solo_lectura ON public.site_settings;
CREATE POLICY demo_solo_lectura ON public.site_settings AS RESTRICTIVE FOR ALL TO authenticated
  USING (true) WITH CHECK (NOT (SELECT public.es_sesion_demo()));

-- Casas: la demo no puede vincular correos ni usuarios reales a una casa demo.
CREATE OR REPLACE FUNCTION public.fn_demo_guardia_casas() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF public.es_sesion_demo() THEN
    IF NEW.owner_email IS NOT NULL AND NEW.owner_email !~* '@demo\.invalid$' THEN
      RAISE EXCEPTION 'DEMO_CORREO_NO_PERMITIDO' USING ERRCODE = '42501';
    END IF;
    IF NEW.owner_user_id IS NOT NULL
       AND (TG_OP = 'INSERT' OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id)
       AND NOT EXISTS (SELECT 1 FROM public.demo_identidades d WHERE d.user_id = NEW.owner_user_id) THEN
      RAISE EXCEPTION 'DEMO_USUARIO_NO_PERMITIDO' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_demo_guardia_casas ON public.houses;
CREATE TRIGGER trg_demo_guardia_casas BEFORE INSERT OR UPDATE ON public.houses
  FOR EACH ROW EXECUTE FUNCTION public.fn_demo_guardia_casas();

-- Storage: la demo solo sube a buckets operativos y no modifica ni borra archivos.
DO $$
BEGIN
  DROP POLICY IF EXISTS demo_subidas ON storage.objects;
  DROP POLICY IF EXISTS demo_sin_editar ON storage.objects;
  DROP POLICY IF EXISTS demo_sin_borrar ON storage.objects;
  CREATE POLICY demo_subidas ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
    WITH CHECK (NOT (SELECT public.es_sesion_demo()) OR bucket_id IN ('receipts', 'payment-proofs', 'parcels'));
  CREATE POLICY demo_sin_editar ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (NOT (SELECT public.es_sesion_demo()));
  CREATE POLICY demo_sin_borrar ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
    USING (NOT (SELECT public.es_sesion_demo()));
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Sin permiso sobre storage.objects: políticas demo de storage no aplicadas';
END $$;

-- 8. Datos de ejemplo del condominio demo (idempotente) -----------------------
DO $$
DECLARE
  v_condo uuid;
  v_area uuid;
  v_survey uuid;
  v_casas uuid[];
  v_creador uuid;
  i integer;
  hoy date := (now() AT TIME ZONE 'America/Santiago')::date;
  anio integer := extract(year FROM (now() AT TIME ZONE 'America/Santiago'))::integer;
  mes integer := extract(month FROM (now() AT TIME ZONE 'America/Santiago'))::integer;
BEGIN
  SELECT id INTO v_condo FROM public.condominiums WHERE es_demo;
  IF v_condo IS NOT NULL THEN RETURN; END IF;

  -- created_by es obligatorio: se usa el super administrador activo más antiguo.
  SELECT s.user_id INTO v_creador FROM public.platform_super_admins s WHERE s.activo ORDER BY s.creado_at LIMIT 1;
  IF v_creador IS NULL THEN RAISE EXCEPTION 'SIN_SUPER_ADMIN_PARA_CREAR_DEMO'; END IF;

  INSERT INTO public.condominiums (name, address, currency, currency_symbol, total_houses, common_expense_amount,
                                   payment_deadline_day, es_demo, created_by)
  VALUES ('Condominio Demo Los Aromos', 'Av. Ejemplo 1234, Santiago', 'CLP', '$', 12, 85000, 10, true, v_creador)
  RETURNING id INTO v_condo;

  FOR i IN 1..12 LOOP
    INSERT INTO public.houses (condo_id, house_number, owner_name, owner_email, is_active, payment_due_day)
    VALUES (v_condo, 'Casa ' || lpad(i::text, 2, '0'),
            (ARRAY['Familia Rojas','Familia Muñoz','Familia Soto','Familia Díaz','Familia Pérez','Familia Contreras',
                   'Familia Silva','Familia Morales','Familia Fuentes','Familia Torres','Familia Araya','Familia Vega'])[i],
            'casa' || lpad(i::text, 2, '0') || '@demo.invalid', true, 10);
  END LOOP;
  SELECT array_agg(id ORDER BY house_number) INTO v_casas FROM public.houses WHERE condo_id = v_condo;

  INSERT INTO public.parameters (condo_id, current_month, current_year, payment_deadline_day, late_fee_percentage,
                                 enable_late_fees, fixed_income_amount, variable_income_amount, initial_balance,
                                 initial_balance_date)
  VALUES (v_condo, mes, anio, 10, 2, true, 85000, 0, 1500000, date_trunc('year', hoy)::date);

  INSERT INTO public.common_areas (condo_id, name, description, is_reservable, max_hours_per_reservation,
                                   opening_time, closing_time, is_paid, usage_fee)
  VALUES (v_condo, 'Quincho', 'Quincho techado con parrilla para 20 personas', true, 5, '10:00', '23:00', true, 15000)
  RETURNING id INTO v_area;
  INSERT INTO public.common_areas (condo_id, name, description, is_reservable, max_hours_per_reservation,
                                   opening_time, closing_time, is_paid, usage_fee)
  VALUES (v_condo, 'Sala multiuso', 'Sala para reuniones y celebraciones', true, 4, '09:00', '22:00', false, 0);

  INSERT INTO public.area_reservations (area_id, house_id, condo_id, reservation_date, start_time, end_time, status, notes)
  VALUES (v_area, v_casas[3], v_condo, hoy + 3, '13:00', '17:00', 'confirmed', 'Cumpleaños');

  INSERT INTO public.alerts (condo_id, title, message, priority, is_active, expires_at)
  VALUES (v_condo, 'Corte de agua programado', 'El jueves de 10:00 a 14:00 se realizará mantención de estanques.',
          'alta', true, hoy + 7);

  INSERT INTO public.condo_expenses (condo_id, title, description, amount, category, expense_date, period_year, period_month)
  VALUES
    (v_condo, 'Mantención de jardines', 'Servicio mensual', 180000, 'Mantención', hoy - 5, anio, mes),
    (v_condo, 'Consumo eléctrico áreas comunes', 'Boleta del mes', 95000, 'Servicios básicos', hoy - 8, anio, mes),
    (v_condo, 'Sueldo conserjería', 'Turno diurno', 520000, 'Remuneraciones', hoy - 2, anio, mes);

  FOR i IN 1..8 LOOP
    INSERT INTO public.condo_income (condo_id, house_id, amount, income_type, description, income_date,
                                     period_year, period_month, status)
    VALUES (v_condo, v_casas[i], 85000, 'gasto_comun', 'Gasto común del mes', hoy - (i % 6), anio, mes, 'approved');
  END LOOP;

  INSERT INTO public.visits (condo_id, house_id, visitor_name, visit_title, visit_date, visit_time, description)
  VALUES
    (v_condo, v_casas[2], 'Carolina Fuentes', 'Visita familiar', hoy, '18:30', 'Llega en auto, patente demo'),
    (v_condo, v_casas[5], 'Técnico de internet', 'Instalación', hoy + 1, '10:00', 'Empresa de telecomunicaciones');

  INSERT INTO public.surveys (condo_id, title, description, is_active, closes_at)
  VALUES (v_condo, '¿Pintamos la fachada este año?', 'Votación informativa para la próxima asamblea', true, now() + interval '20 days')
  RETURNING id INTO v_survey;
  INSERT INTO public.survey_options (survey_id, option_text, display_order)
  VALUES (v_survey, 'Sí, este año', 1), (v_survey, 'Mejor el próximo año', 2), (v_survey, 'No es necesario', 3);
END $$;

COMMIT;
