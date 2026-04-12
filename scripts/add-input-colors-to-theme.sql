-- Add input colors to condominium_themes table
ALTER TABLE condominium_themes
ADD COLUMN IF NOT EXISTS input_bg_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS input_text_color VARCHAR(7) DEFAULT '#0f172a';

-- Update existing records with default values if they don't have them
UPDATE condominium_themes 
SET input_bg_color = '#ffffff', input_text_color = '#0f172a'
WHERE input_bg_color IS NULL OR input_text_color IS NULL;
