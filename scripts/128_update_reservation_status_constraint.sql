-- Update area_reservations status check constraint to include pending and rejected
-- This allows the new workflow: pending -> confirmed/rejected

-- Drop the existing constraint
ALTER TABLE public.area_reservations 
DROP CONSTRAINT IF EXISTS area_reservations_status_check;

-- Add the new constraint with all valid statuses
ALTER TABLE public.area_reservations 
ADD CONSTRAINT area_reservations_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'rejected'));

-- Update any NULL status to 'pending'
UPDATE public.area_reservations 
SET status = 'pending' 
WHERE status IS NULL;
