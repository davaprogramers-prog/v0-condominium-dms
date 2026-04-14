-- Add theme permission column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_change_theme BOOLEAN DEFAULT false;
