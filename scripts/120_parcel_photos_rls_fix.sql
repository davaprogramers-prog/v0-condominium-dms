-- Enable RLS on parcel_photos if not already enabled
ALTER TABLE parcel_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view parcel photos" ON parcel_photos;
DROP POLICY IF EXISTS "Conserje can insert parcel photos" ON parcel_photos;
DROP POLICY IF EXISTS "Propietarios can view their parcel photos" ON parcel_photos;
DROP POLICY IF EXISTS "Admins can manage parcel photos" ON parcel_photos;

-- Policy: Conserje can insert parcel photos in their condo
CREATE POLICY "Conserje can insert parcel photos"
  ON parcel_photos
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT p.id FROM profiles p
      INNER JOIN parcels pa ON p.condo_id = pa.condo_id
      WHERE p.role IN ('conserje', 'admin', 'super_admin')
      AND pa.id = parcel_id
    )
  );

-- Policy: Propietarios can view parcel photos for their properties
CREATE POLICY "Propietarios can view their parcel photos"
  ON parcel_photos
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT p.id FROM profiles p
      INNER JOIN parcels pa ON p.condo_id = pa.condo_id
      INNER JOIN houses h ON pa.house_id = h.id
      WHERE h.property_owner_id = auth.uid() OR p.role IN ('conserje', 'admin', 'super_admin')
      AND pa.id = parcel_id
    )
  );

-- Policy: Admins can see all parcel photos in their condo
CREATE POLICY "Admins can manage parcel photos"
  ON parcel_photos
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT p.id FROM profiles p
      INNER JOIN parcels pa ON p.condo_id = pa.condo_id
      WHERE p.role IN ('admin', 'super_admin')
      AND pa.id = parcel_id
    )
  );
