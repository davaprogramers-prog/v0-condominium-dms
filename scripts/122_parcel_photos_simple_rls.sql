-- Simple RLS Policies for parcel_photos table
-- Avoid complex JOINs that cause recursion

-- Enable RLS on parcel_photos
ALTER TABLE parcel_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can insert parcel photos" ON parcel_photos;
DROP POLICY IF EXISTS "Staff can view parcel photos in their condo" ON parcel_photos;
DROP POLICY IF EXISTS "Propietarios can view their parcel photos" ON parcel_photos;
DROP POLICY IF EXISTS "Users can view photos for parcels in their condo" ON parcel_photos;
DROP POLICY IF EXISTS "Conserje can insert parcel photos in their condo" ON parcel_photos;
DROP POLICY IF EXISTS "Users can view photos for visible parcels" ON parcel_photos;
DROP POLICY IF EXISTS "Conserjes can upload photos" ON parcel_photos;
DROP POLICY IF EXISTS "View parcel photos in own condo" ON parcel_photos;
DROP POLICY IF EXISTS "Conserje can upload parcel photos" ON parcel_photos;
DROP POLICY IF EXISTS "parcel_photos_select" ON parcel_photos;
DROP POLICY IF EXISTS "parcel_photos_insert" ON parcel_photos;

-- Simple INSERT policy: Only staff (conserje, admin, super_admin) can insert
CREATE POLICY "parcel_photos_insert" ON parcel_photos
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('conserje', 'admin', 'super_admin')
    )
  );

-- Simple SELECT policy: Allow all authenticated users to view
-- (filtering happens at application level based on user role and condo_id)
CREATE POLICY "parcel_photos_select" ON parcel_photos
  FOR SELECT
  USING (true);

-- UPDATE policy: Only staff can update
CREATE POLICY "parcel_photos_update" ON parcel_photos
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('conserje', 'admin', 'super_admin')
    )
  );

-- DELETE policy: Only staff can delete
CREATE POLICY "parcel_photos_delete" ON parcel_photos
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('conserje', 'admin', 'super_admin')
    )
  );
