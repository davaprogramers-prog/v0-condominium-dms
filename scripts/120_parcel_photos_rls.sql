-- Enable RLS on parcel_photos table if not already enabled
ALTER TABLE parcel_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Conserje can insert parcel photos" ON parcel_photos;
DROP POLICY IF EXISTS "Conserje can select own parcel photos" ON parcel_photos;

-- Policy: Allow conserje to INSERT parcel photos for their condo's parcels
CREATE POLICY "Conserje can insert parcel photos" ON parcel_photos
  FOR INSERT
  WITH CHECK (
    -- User must be conserje in some condo
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'conserje'
    )
    AND
    -- Parcel must belong to a condo
    parcel_id IN (
      SELECT id FROM parcels
      WHERE condo_id IN (
        SELECT condo_id FROM profiles
        WHERE id = auth.uid() AND role = 'conserje'
      )
    )
  );

-- Policy: Allow conserje to SELECT their own parcel photos
CREATE POLICY "Conserje can select own parcel photos" ON parcel_photos
  FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR
    parcel_id IN (
      SELECT id FROM parcels
      WHERE condo_id IN (
        SELECT condo_id FROM profiles
        WHERE id = auth.uid() AND role = 'conserje'
      )
    )
  );

-- Allow propietarios to SELECT and INSERT their own payment proofs
DROP POLICY IF EXISTS "Propietarios can insert own payment proofs" ON parcel_photos;
DROP POLICY IF EXISTS "Propietarios can view parcel photos" ON parcel_photos;

CREATE POLICY "Propietarios can view parcel photos" ON parcel_photos
  FOR SELECT
  USING (
    -- Can see photos of parcels for their own house
    parcel_id IN (
      SELECT id FROM parcels p
      WHERE p.house_id IN (
        SELECT h.id FROM houses h
        WHERE h.owner_id = auth.uid()
      )
    )
  );

-- Allow admins to do everything
DROP POLICY IF EXISTS "Admin full access parcel photos" ON parcel_photos;

CREATE POLICY "Admin full access parcel photos" ON parcel_photos
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
    )
  );
