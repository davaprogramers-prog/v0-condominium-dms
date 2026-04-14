-- RLS policies for the 'parcels' Storage bucket
-- Note: Storage bucket policies in Supabase are defined at the bucket level
-- These policies allow conserje/admin to upload and propietarios to view

-- Policy 1: Conserje, admin, super_admin can upload parcel photos
-- Path: parcel-photos/{condo_id}/*
-- This policy allows staff to upload photos of parcel reception, delivery, and returns

-- Policy 2: Propietarios can view photos of their own parcels
-- Path: parcel-photos/{condo_id}/{parcel_id}/*
-- This allows owners to see photos related to their properties

-- To apply these via Supabase dashboard:
-- 1. Go to Storage → parcels bucket → Policies
-- 2. Add policy for INSERT:
--    Allowed roles: conserje, admin, super_admin
--    Target paths: parcel-photos/**
--
-- 3. Add policy for SELECT:
--    Allowed roles: authenticated
--    Target paths: parcel-photos/**
--    With verification: User has access to condo or is propietario of the parcel

-- Note: Since you set the bucket to PUBLIC and accept ANY document type,
-- the basic insert/select permissions should be sufficient.
-- The table-level RLS in parcel_photos will enforce who can actually create records.
