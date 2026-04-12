-- Add dialog color columns to condominium_themes table
ALTER TABLE public.condominium_themes
ADD COLUMN IF NOT EXISTS dialog_bg_color VARCHAR DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS dialog_text_color VARCHAR DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS dialog_overlay_color VARCHAR DEFAULT 'rgba(0, 0, 0, 0.5)';

-- Update the updated_at timestamp for existing records
UPDATE public.condominium_themes SET updated_at = now() WHERE updated_at IS NOT NULL;
