-- Add created_by column to visits table
ALTER TABLE public.visits 
ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for created_by
CREATE INDEX IF NOT EXISTS idx_visits_created_by ON public.visits(created_by);
