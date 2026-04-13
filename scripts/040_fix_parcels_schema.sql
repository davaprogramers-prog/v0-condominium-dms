-- Fix parcels table schema to match application requirements
-- Drop existing parcels table and parcel_photos if they exist
DROP TABLE IF EXISTS parcel_photos CASCADE;
DROP TABLE IF EXISTS parcels CASCADE;

-- Create parcels table with correct structure
CREATE TABLE parcels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condo_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  
  -- Basic parcel info
  parcel_type VARCHAR(50) NOT NULL CHECK (parcel_type IN ('envelope', 'package', 'box', 'tube', 'other')),
  "from" VARCHAR(255) NOT NULL, -- Delivery company name
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'delivered', 'returned')),
  received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Photo URLs
  reception_photo_url TEXT,
  delivery_photo_url TEXT,
  return_photo_url TEXT,
  return_reason TEXT,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_parcels_condo_id ON parcels(condo_id);
CREATE INDEX idx_parcels_house_id ON parcels(house_id);
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_created_by ON parcels(created_by);
CREATE INDEX idx_parcels_delivered_by ON parcels(delivered_by);

-- Enable Row Level Security
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conserjes/admins/super_admins (can see all parcels in their condo)
CREATE POLICY "staff_can_view_parcels" ON parcels
  FOR SELECT USING (
    condo_id IN (
      SELECT condo_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('conserje', 'admin', 'super_admin')
    )
  );

-- RLS Policy for owners (can only see their property parcels)
CREATE POLICY "owners_can_view_their_parcels" ON parcels
  FOR SELECT USING (
    house_id IN (
      SELECT house_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policy for staff to create parcels
CREATE POLICY "staff_can_create_parcels" ON parcels
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE condo_id = parcels.condo_id 
      AND role IN ('conserje', 'admin', 'super_admin')
    )
  );

-- RLS Policy for staff to update parcels
CREATE POLICY "staff_can_update_parcels" ON parcels
  FOR UPDATE USING (
    condo_id IN (
      SELECT condo_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('conserje', 'admin', 'super_admin')
    )
  );
