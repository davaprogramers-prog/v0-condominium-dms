-- Fix missing profiles for users without roles
-- This script creates profiles for users that are missing them

-- First, let's see what users exist in auth.users but not in public.profiles
SELECT 
  au.id, 
  au.email,
  au.raw_user_meta_data->>'role' as metadata_role,
  au.raw_user_meta_data->>'is_super_admin' as is_super_admin,
  p.id as profile_id
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Now create profiles for users without them
-- Super admin users (check both role and is_super_admin fields)
INSERT INTO public.profiles (id, role, first_name, last_name, email, created_at, updated_at)
SELECT 
  au.id,
  'super_admin',
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  au.email,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
  AND (au.raw_user_meta_data->>'role' = 'super_admin' OR au.raw_user_meta_data->>'is_super_admin' = 'true')
ON CONFLICT (id) DO NOTHING;

-- Admin users
INSERT INTO public.profiles (id, role, first_name, last_name, email, created_at, updated_at)
SELECT 
  au.id,
  'admin',
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  au.email,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
  AND au.raw_user_meta_data->>'role' = 'admin'
ON CONFLICT (id) DO NOTHING;

-- Default role for anyone else (propietario/owner)
INSERT INTO public.profiles (id, role, first_name, last_name, email, created_at, updated_at)
SELECT 
  au.id,
  'propietario',
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  au.email,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Show the updated profiles
SELECT * FROM public.profiles WHERE email IN ('davaprogramers@gmail.com', 'informatica@grupomining.com');
