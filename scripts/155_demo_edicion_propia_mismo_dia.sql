-- 155: Modo demo — crear sí, borrar nunca, editar solo lo propio creado el mismo día (hora de Chile).
-- Solo afecta sesiones con app_metadata.demo = true (public.es_sesion_demo()).
-- Las acciones con clave de servicio (saltan RLS) usan fn_demo_puede_editar_usuario desde lib/demo/guardia.ts.

BEGIN;

-- 1. Registro de filas creadas por sesiones demo (sirve también en tablas sin created_by).
CREATE TABLE IF NOT EXISTS public.demo_filas_creadas (
  tabla text NOT NULL,
  fila_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  creado_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tabla, fila_id)
);
CREATE INDEX IF NOT EXISTS demo_filas_creadas_user_idx ON public.demo_filas_creadas (user_id);
ALTER TABLE public.demo_filas_creadas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.demo_filas_creadas FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.fn_demo_registrar_fila() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.es_sesion_demo() AND auth.uid() IS NOT NULL THEN
    -- Solo sirve lo creado hoy: lo anterior a 2 días ya no habilita nada.
    DELETE FROM public.demo_filas_creadas WHERE user_id = auth.uid() AND creado_at < now() - interval '2 days';
    INSERT INTO public.demo_filas_creadas (tabla, fila_id, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, auth.uid())
    ON CONFLICT (tabla, fila_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.fn_demo_registrar_fila() FROM PUBLIC, anon, authenticated;

-- 2. ¿Puede este usuario editar esta fila? Creada por él y hoy (America/Santiago).
CREATE OR REPLACE FUNCTION public.fn_demo_puede_editar_usuario(p_tabla text, p_id uuid, p_user uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  hoy date := (now() AT TIME ZONE 'America/Santiago')::date;
  resultado boolean := false;
BEGIN
  IF p_tabla IS NULL OR p_id IS NULL OR p_user IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.demo_filas_creadas f
    WHERE f.tabla = p_tabla AND f.fila_id = p_id AND f.user_id = p_user
      AND (f.creado_at AT TIME ZONE 'America/Santiago')::date = hoy
  ) THEN
    RETURN true;
  END IF;

  -- Filas insertadas por el servidor en nombre del usuario (created_by) sin pasar por el disparador.
  IF EXISTS (
    SELECT 1 FROM pg_attribute a
    WHERE a.attrelid = to_regclass('public.' || quote_ident(p_tabla)) AND a.attname = 'created_by' AND NOT a.attisdropped
  ) AND EXISTS (
    SELECT 1 FROM pg_attribute a
    WHERE a.attrelid = to_regclass('public.' || quote_ident(p_tabla)) AND a.attname = 'created_at' AND NOT a.attisdropped
  ) THEN
    EXECUTE format(
      'SELECT EXISTS (SELECT 1 FROM public.%I WHERE id = $1 AND created_by = $2 AND (created_at AT TIME ZONE ''America/Santiago'')::date = $3)',
      p_tabla
    ) INTO resultado USING p_id, p_user, hoy;
  END IF;

  RETURN coalesce(resultado, false);
END $$;
REVOKE ALL ON FUNCTION public.fn_demo_puede_editar_usuario(text, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_demo_puede_editar_usuario(text, uuid, uuid) TO service_role;

-- Variante para políticas: siempre con el usuario de la sesión (no acepta un usuario arbitrario).
CREATE OR REPLACE FUNCTION public.fn_demo_puede_editar(p_tabla text, p_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.fn_demo_puede_editar_usuario(p_tabla, p_id, auth.uid())
$$;
REVOKE ALL ON FUNCTION public.fn_demo_puede_editar(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_demo_puede_editar(text, uuid) TO authenticated;

-- 3. Disparador de registro + política de edición en toda tabla con condo_id.
--    Excluidas: demo_*, platform_*, profiles (cada uno edita su perfil, ya acotado en 151)
--    y notifications (marcar como leída no es modificar datos).
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables tb ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public' AND c.column_name = 'condo_id' AND tb.table_type = 'BASE TABLE'
      AND c.table_name NOT LIKE 'demo\_%' AND c.table_name NOT LIKE 'platform\_%'
      AND c.table_name NOT IN ('profiles', 'notifications')
      AND EXISTS (SELECT 1 FROM information_schema.columns x
                  WHERE x.table_schema = 'public' AND x.table_name = c.table_name AND x.column_name = 'id')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_demo_registrar_fila ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_demo_registrar_fila AFTER INSERT ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.fn_demo_registrar_fila()', t);

    EXECUTE format('DROP POLICY IF EXISTS demo_editar_propio_hoy ON public.%I', t);
    EXECUTE format($p$CREATE POLICY demo_editar_propio_hoy ON public.%1$I AS RESTRICTIVE FOR UPDATE TO authenticated
      USING (NOT (SELECT public.es_sesion_demo()) OR public.fn_demo_puede_editar(%2$L, id))
      WITH CHECK (NOT (SELECT public.es_sesion_demo()) OR public.fn_demo_puede_editar(%2$L, id))$p$, t, t);
  END LOOP;
END $$;

COMMIT;
