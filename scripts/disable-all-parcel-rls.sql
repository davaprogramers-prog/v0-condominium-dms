-- Disable all RLS policies temporarily to diagnose the issue
ALTER TABLE parcels DISABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_photos DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('parcels', 'parcel_photos');
