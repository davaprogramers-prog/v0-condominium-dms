-- 153: el correo de una casa solo da acceso si el usuario PROBÓ que es suyo.
-- Problema: en Supabase la confirmación de correo está desactivada (mailer_autoconfirm = true).
-- Cualquiera podía crear una cuenta con el correo de un propietario que aún no se registró (incluso
-- con la clave pública, sin pasar por la app) y fn_condos_accesibles le daba acceso a ese condominio
-- por houses.owner_email, y ensureUserProfile le asignaba la casa.
-- Ahora:
--   * auth.users.raw_app_meta_data.correo_verificado = true solo lo fija el servidor, tras validar un
--     código de 6 dígitos enviado a ese correo (o para las cuentas que ya existían antes de esta migración).
--   * fn_condos_accesibles usa owner_email solo si la cuenta tiene ese indicador.
-- Idempotente. Revertir con scripts/153_rollback.sql.

-- 1. Indicador de correo verificado (se lee de auth.users, no del JWT: así no depende de refrescar el token)
CREATE OR REPLACE FUNCTION public.fn_correo_verificado() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE((
    SELECT (u.raw_app_meta_data ->> 'correo_verificado') = 'true'
    FROM auth.users u WHERE u.id = auth.uid()
  ), false)
$$;
REVOKE ALL ON FUNCTION public.fn_correo_verificado() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_correo_verificado() TO authenticated, service_role;

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
           OR (h.owner_email IS NOT NULL
               AND lower(h.owner_email) = lower(auth.jwt() ->> 'email')
               AND (SELECT public.fn_correo_verificado())))
  ) x
$$;
REVOKE ALL ON FUNCTION public.fn_condos_accesibles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_condos_accesibles() TO authenticated, service_role;

-- 2. Cuentas existentes: se conservan (no hay forma de distinguir retroactivamente). Las demo no lo necesitan.
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"correo_verificado": true}'::jsonb
WHERE email NOT LIKE '%@demo.invalid'
  AND NOT (COALESCE(raw_app_meta_data, '{}'::jsonb) ? 'correo_verificado');

-- 3. Códigos de verificación del registro (solo el servidor; se guarda el HMAC, nunca el código)
CREATE TABLE IF NOT EXISTS public.registro_codigos_correo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  intentos integer NOT NULL DEFAULT 0,
  expira_at timestamptz NOT NULL,
  usado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT registro_codigos_email_minuscula CHECK (email = lower(email))
);
CREATE INDEX IF NOT EXISTS registro_codigos_correo_email_idx ON public.registro_codigos_correo (email, created_at DESC);
ALTER TABLE public.registro_codigos_correo ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.registro_codigos_correo FROM anon, authenticated;

-- Emite un código nuevo e invalida los anteriores del mismo correo.
CREATE OR REPLACE FUNCTION public.fn_registro_emitir_codigo(p_email text, p_house uuid, p_hash text, p_minutos integer)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
  UPDATE public.registro_codigos_correo SET usado_at = now()
  WHERE email = lower(p_email) AND usado_at IS NULL;
  INSERT INTO public.registro_codigos_correo (email, house_id, code_hash, expira_at)
  VALUES (lower(p_email), p_house, p_hash, now() + make_interval(mins => p_minutos))
  RETURNING id INTO v_id;
  DELETE FROM public.registro_codigos_correo WHERE created_at < now() - interval '2 days';
  RETURN v_id;
END $$;

-- Verifica el código vigente: máx. 5 intentos; un acierto lo marca usado (un solo uso).
CREATE OR REPLACE FUNCTION public.fn_registro_verificar_codigo(p_email text, p_hash text)
RETURNS TABLE (estado text, house_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r public.registro_codigos_correo%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.registro_codigos_correo c
  WHERE c.email = lower(p_email) AND c.usado_at IS NULL
  ORDER BY c.created_at DESC LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN RETURN QUERY SELECT 'sin_codigo'::text, NULL::uuid; RETURN; END IF;
  IF r.expira_at < now() THEN RETURN QUERY SELECT 'vencido'::text, NULL::uuid; RETURN; END IF;
  IF r.intentos >= 5 THEN RETURN QUERY SELECT 'bloqueado'::text, NULL::uuid; RETURN; END IF;

  IF r.code_hash = p_hash THEN
    UPDATE public.registro_codigos_correo SET usado_at = now() WHERE id = r.id;
    RETURN QUERY SELECT 'ok'::text, r.house_id;
  ELSE
    UPDATE public.registro_codigos_correo SET intentos = intentos + 1 WHERE id = r.id;
    RETURN QUERY SELECT 'invalido'::text, NULL::uuid;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.fn_registro_emitir_codigo(text, uuid, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_registro_verificar_codigo(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_registro_emitir_codigo(text, uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_registro_verificar_codigo(text, text) TO service_role;
