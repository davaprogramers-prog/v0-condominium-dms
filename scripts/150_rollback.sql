-- Rollback de 150_plataforma_super_admin.sql
-- Restaura políticas y funciones originales. Conserva las tablas platform_* (auditoría) sin uso.
-- ADVERTENCIA: vuelve a dejar abierta la escalada por profiles.role = 'super_admin'.

BEGIN;

DO $$
DECLARE
  b record;
  sentencia text;
BEGIN
  FOR b IN SELECT * FROM public.platform_policy_backup LOOP
    IF EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = b.schemaname AND p.tablename = b.tablename AND p.policyname = b.policyname) THEN
      sentencia := format('ALTER POLICY %I ON %I.%I', b.policyname, b.schemaname, b.tablename);
      IF b.qual IS NOT NULL THEN sentencia := sentencia || format(' USING (%s)', b.qual); END IF;
      IF b.with_check IS NOT NULL THEN sentencia := sentencia || format(' WITH CHECK (%s)', b.with_check); END IF;
      EXECUTE sentencia;
    END IF;
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_proteger_perfil ON public.profiles;
DROP FUNCTION IF EXISTS public.fn_proteger_perfil();

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN public.get_user_role(auth.uid()) = 'super_admin';
END $$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(user_role, 'guest');
END $$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN COALESCE(user_role, 'guest');
END $$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'));
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name, created_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''), NEW.created_at)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), profiles.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), profiles.last_name);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END $$;

GRANT EXECUTE ON FUNCTION public.is_super_admin(), public.get_my_role(), public.get_user_role(uuid), public.is_admin_or_super() TO anon, authenticated;

COMMIT;
