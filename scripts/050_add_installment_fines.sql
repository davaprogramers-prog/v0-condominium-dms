-- =============================================
-- Add installment payment support for fines
-- Allows fines to be paid in installments with UF or CLP currency
-- =============================================

-- Add new columns to infractions table
ALTER TABLE infractions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CLP' CHECK (currency IN ('CLP', 'UF')),
ADD COLUMN IF NOT EXISTS amount_pending NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('complete', 'partial', 'pending')),
ADD COLUMN IF NOT EXISTS uf_value_at_creation NUMERIC;

-- Update existing infractions that are paid to have payment_status 'complete'
UPDATE infractions 
SET 
  payment_status = CASE WHEN is_paid = true THEN 'complete' ELSE 'pending' END,
  amount_pending = CASE WHEN is_paid = true THEN 0 ELSE COALESCE(fine_amount, 0) END
WHERE payment_status IS NULL OR payment_status = 'pending';

-- Create table to track installment payments
CREATE TABLE IF NOT EXISTS public.fine_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  infraction_id UUID NOT NULL REFERENCES public.infractions(id) ON DELETE CASCADE,
  condo_income_id UUID REFERENCES public.condo_income(id) ON DELETE SET NULL,
  amount_paid NUMERIC NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('CLP', 'UF')),
  uf_value_at_payment NUMERIC,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fine_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fine_payments_select" ON public.fine_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles 
    INNER JOIN public.infractions ON infractions.condo_id = profiles.condo_id
    WHERE fine_payments.infraction_id = infractions.id AND profiles.id = auth.uid())
);
CREATE POLICY "fine_payments_insert_admin" ON public.fine_payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles 
    INNER JOIN public.infractions ON infractions.condo_id = profiles.condo_id
    WHERE fine_payments.infraction_id = infractions.id AND profiles.id = auth.uid() AND profiles.role = 'admin')
);
