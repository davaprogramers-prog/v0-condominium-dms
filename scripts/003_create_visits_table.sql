-- Create visits table for owners to register visitors
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visit_title TEXT NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME,
  visitor_email TEXT,
  visitor_phone TEXT,
  description TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_visits_condo_id ON visits(condo_id);
CREATE INDEX IF NOT EXISTS idx_visits_house_id ON visits(house_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);

-- Enable RLS
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visits
DROP POLICY IF EXISTS "Users can view visits from their condo" ON visits;
DROP POLICY IF EXISTS "Owners can create visits for their houses" ON visits;
DROP POLICY IF EXISTS "Owners can update their visits" ON visits;

CREATE POLICY "Users can view visits from their condo" ON visits FOR SELECT USING (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Owners can create visits for their houses" ON visits FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM houses h JOIN profiles p ON h.condo_id = p.condo_id WHERE h.id = house_id AND h.condo_id = visits.condo_id AND p.id = auth.uid() AND (p.role = 'propietario' OR p.role = 'admin' OR p.role = 'super_admin')));
CREATE POLICY "Owners can update their visits" ON visits FOR UPDATE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND condo_id = visits.condo_id));
