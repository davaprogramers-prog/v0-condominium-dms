-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('admin', 'owner')),
  condo_id UUID,
  house_id UUID,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Condominiums table
CREATE TABLE IF NOT EXISTS public.condominiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  total_houses INTEGER NOT NULL DEFAULT 1,
  currency_symbol TEXT NOT NULL DEFAULT '$',
  currency_name TEXT NOT NULL DEFAULT 'Peso',
  currency_multiplier NUMERIC NOT NULL DEFAULT 1,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "condos_select" ON public.condominiums FOR SELECT USING (true);
CREATE POLICY "condos_insert" ON public.condominiums FOR INSERT WITH CHECK (auth.uid() = admin_user_id);
CREATE POLICY "condos_update" ON public.condominiums FOR UPDATE USING (auth.uid() = admin_user_id);
CREATE POLICY "condos_delete" ON public.condominiums FOR DELETE USING (auth.uid() = admin_user_id);

-- Houses table
CREATE TABLE IF NOT EXISTS public.houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  house_number TEXT NOT NULL,
  owner_name TEXT,
  owner_email TEXT,
  avatar_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  payment_due_day INTEGER DEFAULT 5,
  custom_payment_deadline DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(condo_id, house_number)
);

ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "houses_select" ON public.houses FOR SELECT USING (true);
CREATE POLICY "houses_insert" ON public.houses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);
CREATE POLICY "houses_update_admin" ON public.houses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
  OR user_id = auth.uid()
);
CREATE POLICY "houses_delete" ON public.houses FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.condominiums WHERE id = condo_id AND admin_user_id = auth.uid())
);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'role', 'owner'),
    COALESCE(new.raw_user_meta_data ->> 'first_name', null),
    COALESCE(new.raw_user_meta_data ->> 'last_name', null)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
