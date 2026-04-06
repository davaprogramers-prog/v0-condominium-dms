-- Crear tabla para logos
CREATE TABLE IF NOT EXISTS logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  blob_url TEXT NOT NULL,
  logo_type TEXT NOT NULL CHECK (logo_type IN ('app', 'expense_category', 'custom')),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'condo')),
  condo_id UUID REFERENCES condominiums(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_logos_type ON logos(logo_type);
CREATE INDEX IF NOT EXISTS idx_logos_scope ON logos(scope);
CREATE INDEX IF NOT EXISTS idx_logos_condo_id ON logos(condo_id);
CREATE INDEX IF NOT EXISTS idx_logos_created_by ON logos(created_by);

-- RLS
ALTER TABLE logos ENABLE ROW LEVEL SECURITY;

-- Super admin puede ver todos los logos globales
CREATE POLICY "super_admin_can_view_global_logos" ON logos FOR SELECT 
USING (scope = 'global' OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Admin puede ver logos de su condominio
CREATE POLICY "admin_can_view_condo_logos" ON logos FOR SELECT 
USING (
  scope = 'global' OR 
  (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid()))
);

-- Super admin puede crear logos globales
CREATE POLICY "super_admin_can_create_global_logos" ON logos FOR INSERT 
WITH CHECK (
  scope = 'global' AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Admin puede crear logos para su condominio
CREATE POLICY "admin_can_create_condo_logos" ON logos FOR INSERT 
WITH CHECK (
  scope = 'condo' AND 
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Super admin puede actualizar todos los logos
CREATE POLICY "super_admin_can_update_logos" ON logos FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Admin puede actualizar logos de su condominio
CREATE POLICY "admin_can_update_condo_logos" ON logos FOR UPDATE 
USING (
  condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) OR
  created_by = auth.uid()
);
