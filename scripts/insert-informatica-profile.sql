-- Insert informatica@grupomining.com into profiles
-- This user exists in auth.users and public.houses

INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  house_id,
  condo_id,
  role,
  created_at
) 
SELECT 
  u.id,
  'informatica@grupomining.com',
  'David',
  'Mora',
  h.id,
  h.condo_id,
  'owner',
  NOW()
FROM auth.users u
CROSS JOIN public.houses h
WHERE u.email = 'informatica@grupomining.com'
  AND h.owner_email = 'informatica@grupomining.com'
ON CONFLICT (id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  condo_id = EXCLUDED.condo_id;
