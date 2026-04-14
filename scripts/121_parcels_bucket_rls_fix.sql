-- Parcels Storage bucket RLS policies
-- The bucket is now set to PUBLIC with no restrictions
-- But we add RLS policies for proper access control

-- Policy: Conserje can upload parcel photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('parcels', 'parcels', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Conserje, Admin, Super Admin can upload to parcels bucket
CREATE POLICY "Conserje can upload parcel photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'parcels'
    AND auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('conserje', 'admin', 'super_admin')
    )
  );

-- Policy: Propietarios can upload receipt proofs (in receipts bucket)
CREATE POLICY "Propietarios can upload receipts"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'propietario'
    )
  );

-- Policy: Anyone can view public parcels bucket objects
CREATE POLICY "Public view parcel photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'parcels');

-- Policy: Anyone can view public statements bucket objects
CREATE POLICY "Public view statements"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'statements');
