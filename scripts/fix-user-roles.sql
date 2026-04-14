-- Fix user roles in profiles table
-- Update davaprogramers@gmail.com to super_admin

-- First, find the user ID from auth.users table
-- UPDATE public.profiles 
-- SET role = 'super_admin'
-- WHERE id IN (SELECT id FROM auth.users WHERE email = 'davaprogramers@gmail.com')
-- AND role = 'Usuario';

-- Alternative: If you know the UUID, use:
-- UPDATE public.profiles 
-- SET role = 'super_admin'
-- WHERE id = 'YOUR_USER_UUID_HERE'
-- AND role = 'Usuario';

-- Check current state
SELECT id, email, (SELECT role FROM public.profiles WHERE profiles.id = auth.users.id) as current_role
FROM auth.users
WHERE email = 'davaprogramers@gmail.com';

-- List all users with their roles
SELECT 
    au.id,
    au.email,
    p.role,
    p.condo_id,
    p.first_name,
    p.last_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
