-- Fix missing profiles for users without roles
-- This script creates profiles for users that are missing them

-- First, check what users exist in auth.users but not in public.profiles
SELECT 
  au.id, 
  au.email,
  au.raw_user_meta_data->>'role' as metadata_role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Create profiles for super admin users
INSERT INTO public.profiles (id, role, name, email)
SELECT 
  au.id,
  'super_admin',
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
  au.email
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
  AND (au.raw_user_meta_data->>'role' = 'super_admin' OR au.raw_user_meta_data->>'is_super_admin' = 'true')
ON CONFLICT (id) DO NOTHING;

-- Create profiles for admin users
INSERT INTO public.profiles (id, role, name, email)
SELECT 
  au.id,
  'admin',
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
  au.email
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
  AND au.raw_user_meta_data->>'role' = 'admin'
ON CONFLICT (id) DO NOTHING;

-- Create default profiles for anyone else (propietario)
INSERT INTO public.profiles (id, role, name, email)
SELECT 
  au.id,
  'propietario',
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
  au.email
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Show the profiles for our test users
SELECT id, role, name, email FROM public.profiles 
WHERE email IN ('davaprogramers@gmail.com', 'informatica@grupomining.com');
