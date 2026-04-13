-- Verify test photo was inserted
SELECT id, parcel_id, photo_url, photo_type, created_at 
FROM parcel_photos 
ORDER BY created_at DESC 
LIMIT 5;
