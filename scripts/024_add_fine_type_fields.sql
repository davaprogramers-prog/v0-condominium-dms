-- Add fine type configuration fields to parameters table
ALTER TABLE parameters ADD COLUMN IF NOT EXISTS fine_type TEXT DEFAULT 'porcentaje';
ALTER TABLE parameters ADD COLUMN IF NOT EXISTS fine_fixed_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE parameters ADD COLUMN IF NOT EXISTS fine_uf_amount NUMERIC(10,2) DEFAULT 0;
