-- Create parcels table with full structure for conserje management
CREATE TABLE IF NOT EXISTS parcels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condo_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  house_id UUID REFERENCES houses(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic parcel info
  parcel_type VARCHAR(50) NOT NULL CHECK (parcel_type IN ('sobre', 'paquete', 'documento', 'otro')),
  from_sender VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  tracking_number VARCHAR(100) UNIQUE,
  
  -- Dates and status
  received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'recibido' CHECK (status IN ('recibido', 'entregado', 'devuelto')),
  delivered_date TIMESTAMP,
  returned_date TIMESTAMP,
  return_reason VARCHAR(500),
  
  -- Physical details
  weight_kg NUMERIC(10, 2),
  dimensions_notes TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create parcel_photos table for storing photos of each state
CREATE TABLE IF NOT EXISTS parcel_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  
  -- Photo metadata
  photo_type VARCHAR(50) NOT NULL CHECK (photo_type IN ('recepcion_garita', 'entrega_propietario', 'devolucion')),
  photo_url VARCHAR(500) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_parcels_condo_id ON parcels(condo_id);
CREATE INDEX IF NOT EXISTS idx_parcels_house_id ON parcels(house_id);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_created_by ON parcels(created_by);
CREATE INDEX IF NOT EXISTS idx_parcel_photos_parcel_id ON parcel_photos(parcel_id);

-- Enable RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parcels
CREATE POLICY "Conserjes can view all parcels in their condo" ON parcels
  FOR SELECT USING (
    condo_id IN (
      SELECT condo_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Owners can view their property parcels" ON parcels
  FOR SELECT USING (
    house_id IN (
      SELECT house_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Conserjes can create parcels in their condo" ON parcels
  FOR INSERT WITH CHECK (
    condo_id IN (
      SELECT condo_id FROM profiles WHERE id = auth.uid() AND role = 'conserje'
    )
  );

CREATE POLICY "Conserjes can update parcel status" ON parcels
  FOR UPDATE USING (
    condo_id IN (
      SELECT condo_id FROM profiles WHERE id = auth.uid() AND role = 'conserje'
    )
  );

-- RLS Policies for parcel_photos
CREATE POLICY "Users can view photos for visible parcels" ON parcel_photos
  FOR SELECT USING (
    parcel_id IN (
      SELECT id FROM parcels WHERE 
        condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
        OR house_id IN (SELECT house_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Conserjes can upload photos" ON parcel_photos
  FOR INSERT WITH CHECK (
    parcel_id IN (
      SELECT id FROM parcels WHERE 
        condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid() AND role = 'conserje')
    )
  );
