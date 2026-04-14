-- Enable RLS on parcel_photos table
ALTER TABLE public.parcel_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "conserje_can_insert_parcel_photos" ON public.parcel_photos;
DROP POLICY IF EXISTS "conserje_can_view_parcel_photos" ON public.parcel_photos;
DROP POLICY IF EXISTS "propietario_can_view_own_parcel_photos" ON public.parcel_photos;
DROP POLICY IF EXISTS "admin_can_view_all_parcel_photos" ON public.parcel_photos;

-- Conserje can insert parcel photos for their condo
CREATE POLICY "conserje_can_insert_parcel_photos" ON public.parcel_photos
  FOR INSERT
  WITH CHECK (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- User's profile must be conserje, admin, or super_admin
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('conserje', 'admin', 'super_admin')
      AND p.condo_id = (
        SELECT c.id FROM public.condominiums c
        INNER JOIN public.parcels pr ON c.id = pr.condo_id
        WHERE pr.id = parcel_id
      )
    )
  );

-- Conserje can view parcel photos for their condo
CREATE POLICY "conserje_can_view_parcel_photos" ON public.parcel_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('conserje', 'admin', 'super_admin')
      AND p.condo_id = (
        SELECT c.id FROM public.condominiums c
        INNER JOIN public.parcels pr ON c.id = pr.condo_id
        WHERE pr.id = parcel_id
      )
    )
    OR
    -- Propietario can view photos for their own parcels
    EXISTS (
      SELECT 1 FROM public.parcels pr
      INNER JOIN public.houses h ON pr.house_id = h.id
      WHERE pr.id = parcel_id
      AND h.user_id = auth.uid()
    )
  );
