-- Migration: Add period_month and period_year to expenses table
-- This script adds accounting period fields to track which month each expense belongs to

-- Add columns if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'period_month') THEN
    ALTER TABLE public.expenses ADD COLUMN period_month INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'period_year') THEN
    ALTER TABLE public.expenses ADD COLUMN period_year INTEGER;
  END IF;
END $$;

-- Populate period_month and period_year from expense_date for existing records that don't have them
UPDATE public.expenses
SET 
  period_month = EXTRACT(MONTH FROM expense_date)::INTEGER,
  period_year = EXTRACT(YEAR FROM expense_date)::INTEGER
WHERE period_month IS NULL OR period_year IS NULL;

-- Create index for faster queries by period
CREATE INDEX IF NOT EXISTS idx_expenses_period ON public.expenses(condo_id, period_year, period_month);
