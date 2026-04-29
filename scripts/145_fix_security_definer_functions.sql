-- Fix SECURITY DEFINER functions that are callable by anon role
-- This script revokes EXECUTE permissions from anon role for sensitive functions
-- and keeps them available only for authenticated users where needed

-- 1. handle_new_user() - This is a TRIGGER function and should NOT be callable via API
-- Revoke from both anon and authenticated - it's only meant to be called by the trigger
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- 2. get_my_condo_id() - Used in RLS policies, needs SECURITY DEFINER
-- Revoke from anon (anonymous users don't have a condo)
-- Keep for authenticated (used in RLS policies for logged-in users)
REVOKE EXECUTE ON FUNCTION public.get_my_condo_id() FROM anon;

-- 3. get_my_role() - Used in RLS policies, needs SECURITY DEFINER
-- Revoke from anon (anonymous users don't have a role)
-- Keep for authenticated (used in RLS policies)
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon;

-- 4. get_user_role(uuid) - Used to get role of specific user
-- Revoke from anon (anonymous users shouldn't query user roles)
-- Keep for authenticated (admins may need this)
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;

-- 5. is_admin_or_super() - Used in RLS policies
-- Revoke from anon (anonymous users are never admin)
-- Keep for authenticated (used in RLS policies)
REVOKE EXECUTE ON FUNCTION public.is_admin_or_super() FROM anon;

-- 6. is_super_admin() - Used in RLS policies
-- Revoke from anon (anonymous users are never super_admin)
-- Keep for authenticated (used in RLS policies)
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;

-- Verify the changes (optional - for debugging)
-- SELECT routine_name, grantee, privilege_type 
-- FROM information_schema.routine_privileges 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('handle_new_user', 'get_my_condo_id', 'get_my_role', 'get_user_role', 'is_admin_or_super', 'is_super_admin');
