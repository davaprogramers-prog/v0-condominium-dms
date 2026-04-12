-- Fix missing profiles for users that exist in auth but not in profiles table
-- This handles cases where auth user creation succeeded but profile creation failed

-- First, let's find the test1@administracioncondominio.app user ID
-- We'll insert profiles for any auth users without profiles

-- Get the condominium ID for "Condominio Test"
WITH condo_info AS (
  SELECT id FROM condominiums WHERE name = 'Condominio Test' LIMIT 1
),
auth_users AS (
  SELECT id, email FROM auth.users 
  WHERE email = 'test1@administracioncondominio.app'
    AND id NOT IN (SELECT id FROM profiles)
)
INSERT INTO profiles (id, email, first_name, last_name, role, condo_id, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'DMS' as first_name,
  'Mora Ahumada' as last_name,
  'admin' as role,
  ci.id as condo_id,
  now(),
  now()
FROM auth_users au, condo_info ci;
