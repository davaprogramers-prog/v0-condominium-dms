-- Create alerts table for condo announcements and notifications
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condominiums(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
  is_active BOOLEAN DEFAULT true,
  expires_at DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Policies for alerts
CREATE POLICY "Users can view alerts for their condo"
  ON alerts FOR SELECT
  USING (
    condo_id IN (
      SELECT condo_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert alerts"
  ON alerts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND condo_id = alerts.condo_id 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update alerts"
  ON alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND condo_id = alerts.condo_id 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete alerts"
  ON alerts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND condo_id = alerts.condo_id 
      AND role = 'admin'
    )
  );
