-- Add notes column to bank_statements table
ALTER TABLE bank_statements 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add statement_date column if it doesn't exist
ALTER TABLE bank_statements 
ADD COLUMN IF NOT EXISTS statement_date DATE;
