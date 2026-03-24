-- Expense types
CREATE TABLE IF NOT EXISTS public.expense_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_types_select" ON public.expense_types FOR SELECT USING (true);
CREATE POLICY "expense_types_insert" ON public.expense_types FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
CREATE POLICY "expense_types_update" ON public.expense_types FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
CREATE POLICY "expense_types_delete" ON public.expense_types FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  expense_type_id UUID NOT NULL REFERENCES public.expense_types(id),
  amount NUMERIC NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  receipt_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
