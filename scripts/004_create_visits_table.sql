-- Create visits table
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  visitor_name VARCHAR NOT NULL,
  visit_title VARCHAR NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME,
  visitor_email VARCHAR,
  visitor_phone VARCHAR,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on visits table
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view visits from their condo
DROP POLICY IF EXISTS "Users can view visits from their condo" ON public.visits;
CREATE POLICY "Users can view visits from their condo"
  ON public.visits
  FOR SELECT
  USING (
    condo_id IN (SELECT condo_id FROM public.profiles WHERE id = auth.uid())
  );

-- Policy: Users can create visits for their condo
DROP POLICY IF EXISTS "Users can create visits for their condo" ON public.visits;
CREATE POLICY "Users can create visits for their condo"
  ON public.visits
  FOR INSERT
  WITH CHECK (
    condo_id IN (SELECT condo_id FROM public.profiles WHERE id = auth.uid())
  );

-- Policy: Users can update visits from their condo
DROP POLICY IF EXISTS "Users can update visits from their condo" ON public.visits;
CREATE POLICY "Users can update visits from their condo"
  ON public.visits
  FOR UPDATE
  USING (
    condo_id IN (SELECT condo_id FROM public.profiles WHERE id = auth.uid())
  );

-- Policy: Users can delete visits from their condo
DROP POLICY IF EXISTS "Users can delete visits from their condo" ON public.visits;
CREATE POLICY "Users can delete visits from their condo"
  ON public.visits
  FOR DELETE
  USING (
    condo_id IN (SELECT condo_id FROM public.profiles WHERE id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_condo_id ON public.visits(condo_id);
CREATE INDEX IF NOT EXISTS idx_visits_house_id ON public.visits(house_id);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON public.visits(visit_date);
