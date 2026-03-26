-- Add maintenance_notes column to common_areas table
ALTER TABLE common_areas ADD COLUMN IF NOT EXISTS maintenance_notes TEXT;
