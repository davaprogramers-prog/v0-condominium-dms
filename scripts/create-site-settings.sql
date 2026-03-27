-- Create site_settings table for storing logo and other site configurations
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  logo_url TEXT,
  site_name TEXT DEFAULT 'InteliCon',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO site_settings (id, site_name) 
VALUES ('default', 'InteliCon')
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for logos (run in Supabase Dashboard -> Storage)
-- Note: You need to create a bucket named 'logos' in Supabase Storage
-- and set it to public access

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read site settings
CREATE POLICY "Anyone can read site settings" ON site_settings
  FOR SELECT USING (true);

-- Only super_admin can update site settings
CREATE POLICY "Super admin can update site settings" ON site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );
