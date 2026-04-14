-- Disable RLS on tables that shouldn't have it or are causing issues
-- These tables are admin-controlled and don't need row-level security

ALTER TABLE public.document_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominium_amenities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenity_booking_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proof_status DISABLE ROW LEVEL SECURITY;

-- Verify changes
SELECT table_name, row_security_enabled 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND row_security_enabled = true 
ORDER BY table_name;
