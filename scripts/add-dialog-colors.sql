-- Add dialog color columns to condominium_themes table
ALTER TABLE public.condominium_themes
ADD COLUMN IF NOT EXISTS dialog_bg_color VARCHAR DEFAULT '#1e293b',
ADD COLUMN IF NOT EXISTS dialog_text_color VARCHAR DEFAULT '#ffffff';

-- Update existing records with default values
UPDATE public.condominium_themes
SET dialog_bg_color = '#1e293b', dialog_text_color = '#ffffff'
WHERE dialog_bg_color IS NULL OR dialog_text_color IS NULL;
