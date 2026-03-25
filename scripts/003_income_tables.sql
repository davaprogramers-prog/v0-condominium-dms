-- Income types
CREATE TABLE IF NOT EXISTS public.income_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.income_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "income_types_select" ON public.income_types FOR SELECT USING (true);
CREATE POLICY "income_types_insert" ON public.income_types FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
CREATE POLICY "income_types_update" ON public.income_types FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
CREATE POLICY "income_types_delete" ON public.income_types FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Incomes
CREATE TABLE IF NOT EXISTS public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_id UUID REFERENCES public.houses(id) ON DELETE SET NULL,
  income_type_id UUID NOT NULL REFERENCES public.income_types(id),
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incomes_select" ON public.incomes FOR SELECT USING (true);
CREATE POLICY "incomes_insert" ON public.incomes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
CREATE POLICY "incomes_update" ON public.incomes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
CREATE POLICY "incomes_delete" ON public.incomes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Payment receipts
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  income_id UUID REFERENCES public.incomes(id) ON DELETE SET NULL,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  receipt_url TEXT NOT NULL,
  upload_date DATE DEFAULT CURRENT_DATE,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts_select" ON public.payment_receipts FOR SELECT USING (true);
CREATE POLICY "receipts_insert" ON public.payment_receipts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.houses WHERE id = house_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
CREATE POLICY "receipts_update" ON public.payment_receipts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
CREATE POLICY "receipts_delete" ON public.payment_receipts FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
