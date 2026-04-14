-- Disable RLS temporarily to diagnose and rebuild policies cleanly
ALTER TABLE parcels DISABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_photos DISABLE ROW LEVEL SECURITY;

-- Drop existing broken policies
DROP POLICY IF EXISTS "Users can view parcels in their condo" ON parcels;
DROP POLICY IF EXISTS "Conserje can insert parcels in their condo" ON parcels;
DROP POLICY IF EXISTS "Conserje can update parcels in their condo if recibido" ON parcels;
DROP POLICY IF EXISTS "Users can view photos for parcels in their condo" ON parcel_photos;
DROP POLICY IF EXISTS "Conserje can insert parcel photos in their condo" ON parcel_photos;

-- Re-enable RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_photos ENABLE ROW LEVEL SECURITY;

-- Simple SELECT policy - users can see parcels in their condo
CREATE POLICY "View parcels in own condo" ON parcels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND profiles.condo_id = parcels.condo_id
    )
  );

-- Simple INSERT policy - conserjes can insert in their condo
CREATE POLICY "Conserje can create parcels" ON parcels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND profiles.role = 'conserje'
      AND profiles.condo_id = condo_id
    )
  );

-- Simple UPDATE policy - conserjes can update if recibido
CREATE POLICY "Conserje can update parcels when recibido" ON parcels
  FOR UPDATE USING (
    status = 'recibido' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND profiles.role = 'conserje'
      AND profiles.condo_id = parcels.condo_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND profiles.role = 'conserje'
      AND profiles.condo_id = condo_id
    )
  );

-- Photos policies - simple version
CREATE POLICY "View parcel photos in own condo" ON parcel_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN parcels pr ON p.condo_id = pr.condo_id
      WHERE p.id = auth.uid()
      AND pr.id = parcel_photos.parcel_id
    )
  );

CREATE POLICY "Conserje can upload parcel photos" ON parcel_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN parcels pr ON p.condo_id = pr.condo_id
      WHERE p.id = auth.uid()
      AND p.role = 'conserje'
      AND pr.id = parcel_id
    )
  );
