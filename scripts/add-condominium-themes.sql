-- Condominium Themes Table
CREATE TABLE IF NOT EXISTS public.condominium_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL UNIQUE REFERENCES public.condominiums(id) ON DELETE CASCADE,
  enable_custom_theme BOOLEAN DEFAULT false,
  sidebar_bg_color VARCHAR(7) DEFAULT '#1e293b',
  main_bg_color VARCHAR(7) DEFAULT '#f1f5f9',
  card_bg_color VARCHAR(7) DEFAULT '#ffffff',
  sidebar_text_color VARCHAR(7) DEFAULT '#ffffff',
  main_text_color VARCHAR(7) DEFAULT '#0f172a',
  card_text_color VARCHAR(7) DEFAULT '#0f172a',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
