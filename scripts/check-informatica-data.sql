-- Check what data exists for informatica@grupomining.com
SELECT 
  'houses' as tabla,
  id,
  condo_id,
  owner_email,
  owner_user_id
FROM public.houses
WHERE owner_email = 'informatica@grupomining.com'
UNION ALL
SELECT 
  'house_owners' as tabla,
  house_id::text as id,
  NULL::uuid as condo_id,
  user_email as owner_email,
  NULL::uuid as owner_user_id
FROM public.house_owners
WHERE user_email = 'informatica@grupomining.com'
UNION ALL
SELECT 
  'profiles' as tabla,
  id::text,
  condo_id,
  email as owner_email,
  NULL::uuid as owner_user_id
FROM public.profiles
WHERE email = 'informatica@grupomining.com';
