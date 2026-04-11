-- Create condominium_themes table for color customization
CREATE TABLE IF NOT EXISTS condominium_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  enable_custom_theme BOOLEAN DEFAULT false,
  sidebar_bg_color VARCHAR(7) DEFAULT '#1e293b',
  main_bg_color VARCHAR(7) DEFAULT '#f1f5f9',
  card_bg_color VARCHAR(7) DEFAULT '#ffffff',
  sidebar_text_color VARCHAR(7) DEFAULT '#ffffff',
  main_text_color VARCHAR(7) DEFAULT '#0f172a',
  card_text_color VARCHAR(7) DEFAULT '#0f172a',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(condominium_id)
);

-- Enable RLS
ALTER TABLE condominium_themes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their condominium theme"
  ON condominium_themes FOR SELECT
  USING (
    condominium_id IN (
      SELECT id FROM condominiums 
      WHERE id = auth.jwt() ->> 'condominium_id'
    )
  );

CREATE POLICY "Only admins can update condominium theme"
  ON condominium_themes FOR UPDATE
  USING (
    condominium_id IN (
      SELECT condominium_id FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can insert condominium theme"
  ON condominium_themes FOR INSERT
  WITH CHECK (
    condominium_id IN (
      SELECT condominium_id FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
