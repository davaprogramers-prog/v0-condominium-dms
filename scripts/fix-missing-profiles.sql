-- Fix missing profiles for users without roles
-- This script creates profiles for users that are missing them, with minimal columns

-- Check existing users in profiles
SELECT id, role FROM public.profiles LIMIT 5;

-- Create profiles for super admin users (only id and role columns)
INSERT INTO public.profiles (id, role)
SELECT 
  au.id,
  'super_admin'
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
  AND (au.raw_user_meta_data->>'role' = 'super_admin' OR au.raw_user_meta_data->>'is_super_admin' = 'true')
ON CONFLICT (id) DO NOTHING;

-- Create profiles for admin users
INSERT INTO public.profiles (id, role)
SELECT 
  au.id,
  'admin'
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
  AND au.raw_user_meta_data->>'role' = 'admin'
ON CONFLICT (id) DO NOTHING;

-- Create default profiles for anyone else (propietario)
INSERT INTO public.profiles (id, role)
SELECT 
  au.id,
  'propietario'
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Show the profiles for our test users
SELECT id, role FROM public.profiles 
WHERE id IN (
  SELECT id FROM auth.users WHERE email IN ('davaprogramers@gmail.com', 'informatica@grupomining.com')
);
