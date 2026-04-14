-- RLS policies for 'parcels' Storage bucket
-- Allow conserje to upload parcel photos

-- Policy 1: Conserje can upload files to their condo's parcel-photos folder
CREATE POLICY "Conserje upload parcel photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'parcels' 
  AND 
  (storage.foldername(name))[1] = 'parcel-photos'
  AND
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role = 'conserje'
  )
);

-- Policy 2: Conserje can view files they uploaded
CREATE POLICY "Conserje view own parcel photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'parcels'
  AND
  (storage.foldername(name))[1] = 'parcel-photos'
  AND
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role = 'conserje'
  )
);

-- Policy 3: Propietarios can view parcel photos
CREATE POLICY "Propietarios view parcel photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'parcels'
  AND
  (storage.foldername(name))[1] = 'parcel-photos'
  AND
  auth.uid() IN (
    SELECT ho.owner_id FROM houses h
    INNER JOIN house_owners ho ON h.id = ho.house_id
  )
);

-- Policy 4: Admin/Super admin full access
CREATE POLICY "Admin full access parcels bucket"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'parcels'
  AND
  auth.uid() IN (
    SELECT id FROM profiles
    WHERE role IN ('admin', 'super_admin')
  )
);
