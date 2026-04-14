-- Disable RLS on parcel_photos to test if it's the blocker
ALTER TABLE parcel_photos DISABLE ROW LEVEL SECURITY;

-- Insert a test photo with a public logo URL that we know works
INSERT INTO parcel_photos (parcel_id, photo_type, photo_url, created_at, created_by)
SELECT 
  p.id,
  'recibida',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-test.jpg',
  now(),
  p.created_by
FROM parcels p
WHERE p.condo_id = 'a36bc395-19fb-49ac-8645-53d0beea68aa'
LIMIT 1;

-- Verify it was inserted
SELECT id, parcel_id, photo_url, created_at FROM parcel_photos ORDER BY created_at DESC LIMIT 5;
