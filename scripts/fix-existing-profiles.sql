-- Fix existing profiles that don't have condo_id but have house_id
-- This updates profiles to get the condo_id from their associated house

UPDATE profiles
SET condo_id = h.condo_id
FROM houses h
WHERE profiles.house_id = h.id
  AND profiles.condo_id IS NULL
  AND h.condo_id IS NOT NULL;

-- Log the result
SELECT COUNT(*) as profiles_updated FROM profiles WHERE condo_id IS NOT NULL;
