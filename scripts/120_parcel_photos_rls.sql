-- RLS Policies for parcel_photos table
-- Allow conserje, admin, super_admin to insert parcel photos
-- Allow propietarios to view their own parcel photos

-- Enable RLS on parcel_photos if not already enabled
ALTER TABLE parcel_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Staff can insert parcel photos" ON parcel_photos;
DROP POLICY IF EXISTS "Propietarios can view their parcel photos" ON parcel_photos;

-- Policy: Conserje/Admin/Super_admin can insert parcel photos
CREATE POLICY "Staff can insert parcel photos" ON parcel_photos
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('conserje', 'admin', 'super_admin')
    )
  );

-- Policy: Staff can view all parcel photos in their condo
CREATE POLICY "Staff can view parcel photos in their condo" ON parcel_photos
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT pr.id FROM profiles pr
      INNER JOIN parcels p ON pr.condo_id = p.condo_id
      WHERE pr.role IN ('conserje', 'admin', 'super_admin')
      AND p.id = parcel_photos.parcel_id
    )
  );

-- Policy: Propietarios can view photos of their own parcels
CREATE POLICY "Propietarios can view their parcel photos" ON parcel_photos
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT pr.id FROM profiles pr
      INNER JOIN parcels p ON pr.condo_id = p.condo_id
      INNER JOIN houses h ON p.house_id = h.id
      WHERE pr.id = h.propietario_id
      AND p.id = parcel_photos.parcel_id
    )
  );
