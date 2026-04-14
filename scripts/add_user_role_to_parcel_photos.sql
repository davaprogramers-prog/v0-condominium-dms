-- Add uploaded_by_role column to parcel_photos table
ALTER TABLE public.parcel_photos
ADD COLUMN uploaded_by_role VARCHAR(50) DEFAULT 'conserje';

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_parcel_photos_uploaded_by_role 
ON public.parcel_photos USING btree (uploaded_by_role);
