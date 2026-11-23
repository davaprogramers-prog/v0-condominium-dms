BEGIN;

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public' AND policyname = 'demo_editar_propio_hoy'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS demo_editar_propio_hoy ON public.%I', t);
  END LOOP;
  FOR t IN
    SELECT DISTINCT event_object_table FROM information_schema.triggers
    WHERE trigger_schema = 'public' AND trigger_name = 'trg_demo_registrar_fila'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_demo_registrar_fila ON public.%I', t);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.fn_demo_puede_editar(text, uuid);
DROP FUNCTION IF EXISTS public.fn_demo_puede_editar_usuario(text, uuid, uuid);
DROP FUNCTION IF EXISTS public.fn_demo_registrar_fila();
DROP TABLE IF EXISTS public.demo_filas_creadas;

COMMIT;
