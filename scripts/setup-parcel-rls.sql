-- Enable RLS on parcels and parcel_photos tables
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view parcels in their condo" ON parcels;
DROP POLICY IF EXISTS "Conserje can insert parcels in their condo" ON parcels;
DROP POLICY IF EXISTS "Conserje can update parcels in their condo if recibido" ON parcels;
DROP POLICY IF EXISTS "Users can view photos for parcels in their condo" ON parcel_photos;
DROP POLICY IF EXISTS "Conserje can insert parcel photos in their condo" ON parcel_photos;

-- Parcels table policies
CREATE POLICY "Users can view parcels in their condo" ON parcels
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE condo_id = parcels.condo_id
    )
  );

CREATE POLICY "Conserje can insert parcels in their condo" ON parcels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'conserje'
      AND condo_id = NEW.condo_id
    )
  );

CREATE POLICY "Conserje can update parcels in their condo if recibido" ON parcels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'conserje'
      AND condo_id = parcels.condo_id
    ) AND parcels.status = 'recibido'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'conserje'
      AND condo_id = NEW.condo_id
    )
  );

-- Parcel photos table policies
CREATE POLICY "Users can view photos for parcels in their condo" ON parcel_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parcels p
      JOIN profiles pr ON pr.condo_id = p.condo_id
      WHERE pr.id = auth.uid()
      AND p.id = parcel_photos.parcel_id
    )
  );

CREATE POLICY "Conserje can insert parcel photos in their condo" ON parcel_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM parcels p
      JOIN profiles pr ON pr.condo_id = p.condo_id
      WHERE pr.id = auth.uid()
      AND pr.role = 'conserje'
      AND p.id = parcel_photos.parcel_id
    )
  );
