-- Add status column to infractions table
ALTER TABLE infractions ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendiente';

-- Update existing infractions to have status 'pendiente'
UPDATE infractions SET status = 'pendiente' WHERE status IS NULL;
