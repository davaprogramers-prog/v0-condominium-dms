-- Check what data exists for informatica@grupomining.com
SELECT 'houses' as table_name, id, owner_email, condo_id FROM public.houses WHERE owner_email = 'informatica@grupomining.com'
UNION ALL
SELECT 'profiles', id, email, condo_id FROM public.profiles WHERE email = 'informatica@grupomining.com'
UNION ALL
SELECT 'auth.users', id, email, email FROM auth.users WHERE email = 'informatica@grupomining.com';
