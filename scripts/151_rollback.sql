-- Reversión de 151_modo_demo.sql. Elimina el condominio demo, sus datos y las identidades demo.
BEGIN;

DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE policyname IN ('demo_aislamiento', 'demo_sin_borrar', 'demo_solo_lectura_ins', 'demo_solo_lectura_upd',
                         'demo_sin_acceso', 'demo_perfil_lectura', 'demo_perfil_alta', 'demo_perfil_edicion',
                         'demo_solo_lectura', 'demo_subidas', 'demo_sin_editar')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', t.policyname, t.schemaname, t.tablename);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_demo_guardia_casas ON public.houses;
DROP FUNCTION IF EXISTS public.fn_demo_guardia_casas();

-- Usuarios demo de Auth (cascada a perfiles e identidades).
DELETE FROM auth.users u USING public.demo_identidades d WHERE d.user_id = u.id;
DELETE FROM auth.users WHERE email LIKE 'demo-%@demo.invalid';

DELETE FROM public.condominiums WHERE es_demo;

DROP FUNCTION IF EXISTS public.fn_demo_tocar(uuid);
DROP FUNCTION IF EXISTS public.fn_demo_liberar(uuid);
DROP FUNCTION IF EXISTS public.fn_demo_reanudar(text, text, text);
DROP FUNCTION IF EXISTS public.fn_demo_descartar(uuid);
DROP FUNCTION IF EXISTS public.fn_demo_activar(uuid, uuid);
DROP FUNCTION IF EXISTS public.fn_demo_reservar(text, text, text);
DROP FUNCTION IF EXISTS public.fn_demo_limpiar_usuario(uuid, uuid);
DROP FUNCTION IF EXISTS public.demo_condo_vigente();
DROP FUNCTION IF EXISTS public.es_sesion_demo();

DROP TABLE IF EXISTS public.demo_eventos;
DROP TABLE IF EXISTS public.demo_identidades;
DROP TABLE IF EXISTS public.demo_config;

DROP INDEX IF EXISTS public.condominiums_un_solo_demo;
ALTER TABLE public.condominiums DROP COLUMN IF EXISTS es_demo;

COMMIT;
