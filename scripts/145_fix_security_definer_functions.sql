-- Fix SECURITY DEFINER functions that are callable by anon role
-- Revoke EXECUTE from anon role for security

DO $$
BEGIN
  -- handle_new_user() - trigger function, should not be callable via API
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not revoke handle_new_user: %', SQLERRM;
  END;

  -- get_my_condo_id() - used in RLS, revoke from anon only
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.get_my_condo_id() FROM anon;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not revoke get_my_condo_id: %', SQLERRM;
  END;

  -- get_my_role() - used in RLS, revoke from anon only  
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not revoke get_my_role: %', SQLERRM;
  END;

  -- get_user_role(uuid) - revoke from anon
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not revoke get_user_role: %', SQLERRM;
  END;

  -- is_admin_or_super() - used in RLS, revoke from anon
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.is_admin_or_super() FROM anon;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not revoke is_admin_or_super: %', SQLERRM;
  END;

  -- is_super_admin() - used in RLS, revoke from anon
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not revoke is_super_admin: %', SQLERRM;
  END;
END $$;
