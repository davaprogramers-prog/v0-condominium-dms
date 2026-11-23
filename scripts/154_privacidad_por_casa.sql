-- 154: un residente (propietario/owner) solo ve y escribe comprobantes de pago, encomiendas y visitas
-- de SUS casas. Admin, conserje y super admin no cambian. Rollback: scripts/154_rollback.sql
BEGIN;

CREATE OR REPLACE FUNCTION public.fn_mis_casas() RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(array_agg(DISTINCT x.id), '{}'::uuid[]) FROM (
    SELECT p.house_id AS id FROM public.profiles p WHERE p.id = auth.uid() AND p.house_id IS NOT NULL
    UNION
    SELECT h.id FROM public.houses h WHERE h.owner_user_id = auth.uid()
    UNION
    SELECT h.id FROM public.houses h
     WHERE coalesce((auth.jwt() -> 'app_metadata' ->> 'correo_verificado')::boolean, false)
       AND lower(h.owner_email) = lower(auth.jwt() ->> 'email')
  ) x
$$;

CREATE OR REPLACE FUNCTION public.fn_es_residente_sesion() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce((SELECT p.role IN ('propietario', 'owner') FROM public.profiles p WHERE p.id = auth.uid()), false)
$$;

REVOKE ALL ON FUNCTION public.fn_mis_casas() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_es_residente_sesion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_mis_casas() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_es_residente_sesion() TO authenticated, service_role;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['payment_proofs', 'parcels', 'visits'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS residente_solo_su_casa ON public.%I', t);
    EXECUTE format($p$
      CREATE POLICY residente_solo_su_casa ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
      USING ((NOT (SELECT public.fn_es_residente_sesion())) OR house_id = ANY ((SELECT public.fn_mis_casas())::uuid[]))
      WITH CHECK ((NOT (SELECT public.fn_es_residente_sesion())) OR house_id = ANY ((SELECT public.fn_mis_casas())::uuid[]))
    $p$, t);
  END LOOP;
END $$;

COMMIT;
