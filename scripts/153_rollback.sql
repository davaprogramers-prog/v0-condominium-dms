-- Revierte 153: fn_condos_accesibles vuelve a aceptar owner_email sin verificar (versión de 152).
-- El indicador correo_verificado se deja en auth.users (no otorga nada sin esta migración).
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

DROP FUNCTION IF EXISTS public.fn_registro_verificar_codigo(text, text);
DROP FUNCTION IF EXISTS public.fn_registro_emitir_codigo(text, uuid, text, integer);
DROP TABLE IF EXISTS public.registro_codigos_correo;
DROP FUNCTION IF EXISTS public.fn_correo_verificado();
