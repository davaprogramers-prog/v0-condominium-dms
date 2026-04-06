-- Add conserje role if not exists
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'conserje';

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

-- Create supply_requests table for concierge to request materials
CREATE TABLE IF NOT EXISTS supply_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_title TEXT NOT NULL,
  request_description TEXT NOT NULL,
  request_category TEXT NOT NULL CHECK (request_category IN ('cleaning', 'materials', 'supplies', 'maintenance', 'other')),
  quantity INT,
  unit_price DECIMAL(10, 2),
  estimated_cost DECIMAL(10, 2),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'purchased', 'completed', 'rejected')),
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  linked_expense_id UUID REFERENCES condo_expenses(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create concierge worklog table
CREATE TABLE IF NOT EXISTS concierge_worklogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  concierge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('visit', 'delivery', 'maintenance', 'security', 'cleaning', 'other')),
  activity_description TEXT NOT NULL,
  house_id UUID REFERENCES houses(id) ON DELETE SET NULL,
  activity_date DATE NOT NULL,
  activity_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_visits_condo_id ON visits(condo_id);
CREATE INDEX IF NOT EXISTS idx_visits_house_id ON visits(house_id);
CREATE INDEX IF NOT EXISTS idx_visits_created_by ON visits(created_by);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);

CREATE INDEX IF NOT EXISTS idx_supply_requests_condo_id ON supply_requests(condo_id);
CREATE INDEX IF NOT EXISTS idx_supply_requests_created_by ON supply_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_supply_requests_status ON supply_requests(status);

CREATE INDEX IF NOT EXISTS idx_worklogs_condo_id ON concierge_worklogs(condo_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_concierge_id ON concierge_worklogs(concierge_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_date ON concierge_worklogs(activity_date);

-- Enable RLS
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_worklogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visits
CREATE POLICY "Users can view visits from their condo" ON visits
  FOR SELECT USING (
    condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Owners can create visits for their houses" ON visits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM houses h
      JOIN profiles p ON h.condo_id = p.condo_id
      WHERE h.id = house_id 
      AND h.condo_id = visits.condo_id
      AND p.id = auth.uid()
      AND (p.role = 'propietario' OR p.role = 'admin' OR p.role = 'super_admin')
    )
  );

CREATE POLICY "Owners can update their visits" ON visits
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND condo_id = visits.condo_id
    )
  );

-- RLS Policies for supply_requests
CREATE POLICY "Users can view supply requests from their condo" ON supply_requests
  FOR SELECT USING (
    condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Concierge can create supply requests" ON supply_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'conserje'
      AND condo_id = supply_requests.condo_id
    )
  );

CREATE POLICY "Admins can manage supply requests" ON supply_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND condo_id = supply_requests.condo_id
    )
  );

-- RLS Policies for concierge_worklogs
CREATE POLICY "Users can view worklogs from their condo" ON concierge_worklogs
  FOR SELECT USING (
    condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Concierge can create worklogs" ON concierge_worklogs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'conserje'
      AND condo_id = concierge_worklogs.condo_id
    )
  );
