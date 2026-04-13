-- Test insert with logo URL to verify parcel_photos works
INSERT INTO parcel_photos (parcel_id, photo_url, photo_type, uploaded_by)
SELECT 
  p.id,
  'https://www.svgrepo.com/show/333619/database.svg',
  'recepcion_garita',
  p.created_by
FROM parcels p
WHERE p.status = 'recibido'
LIMIT 1;

-- Verify the photo was inserted
SELECT id, parcel_id, photo_url, photo_type, uploaded_by, created_at FROM parcel_photos ORDER BY created_at DESC LIMIT 5;
