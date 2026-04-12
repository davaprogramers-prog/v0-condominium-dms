-- Get the house info for informatica@grupomining.com
-- SELECT id, condo_id FROM public.houses WHERE owner_email = 'informatica@grupomining.com';

-- Update the profile with correct condo_id and house_id
UPDATE public.profiles 
SET 
  condo_id = (SELECT condo_id FROM public.houses WHERE owner_email = 'informatica@grupomining.com' LIMIT 1),
  house_id = (SELECT id FROM public.houses WHERE owner_email = 'informatica@grupomining.com' LIMIT 1)
WHERE email = 'informatica@grupomining.com';

-- Verify the update
SELECT id, email, condo_id, house_id FROM public.profiles WHERE email = 'informatica@grupomining.com';
