-- Add separate exemption percentages for fixed and variable common expenses
-- fixed_percentage: % exonerated from the FIXED common expense (gasto común fijo)
-- variable_percentage: % exonerated from the VARIABLE common expense (gasto común variable)

ALTER TABLE public.exemptions
  ADD COLUMN IF NOT EXISTS fixed_percentage NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS variable_percentage NUMERIC NOT NULL DEFAULT 0;

-- Backfill: if an exemption already had a legacy "percentage" value, apply it to both types
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'exemptions' AND column_name = 'percentage'
  ) THEN
    UPDATE public.exemptions
    SET fixed_percentage = COALESCE(percentage, 0),
        variable_percentage = COALESCE(percentage, 0)
    WHERE (fixed_percentage = 0 AND variable_percentage = 0)
      AND percentage IS NOT NULL;
  END IF;
END $$;
