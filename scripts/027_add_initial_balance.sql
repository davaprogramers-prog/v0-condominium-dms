-- Add initial balance fields to parameters table
ALTER TABLE parameters ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(12,2) DEFAULT 0;
ALTER TABLE parameters ADD COLUMN IF NOT EXISTS initial_balance_date DATE;

-- Comment explaining the fields
COMMENT ON COLUMN parameters.initial_balance IS 'Starting balance for the condominium - used as the first month previous balance';
COMMENT ON COLUMN parameters.initial_balance_date IS 'Date when the initial balance was set - marks the start of financial tracking';
