BEGIN;
DROP POLICY IF EXISTS residente_solo_su_casa ON public.payment_proofs;
DROP POLICY IF EXISTS residente_solo_su_casa ON public.parcels;
DROP POLICY IF EXISTS residente_solo_su_casa ON public.visits;
DROP FUNCTION IF EXISTS public.fn_mis_casas();
DROP FUNCTION IF EXISTS public.fn_es_residente_sesion();
COMMIT;
