-- Add fine type configuration fields to parameters table
ALTER TABLE parameters 
ADD COLUMN IF NOT EXISTS fine_type TEXT DEFAULT 'porcentaje' CHECK (fine_type IN ('porcentaje', 'fijo', 'uf'));

ALTER TABLE parameters 
ADD COLUMN IF NOT EXISTS fine_fixed_amount NUMERIC(12,2) DEFAULT 0;

ALTER TABLE parameters 
ADD COLUMN IF NOT EXISTS fine_uf_amount NUMERIC(10,2) DEFAULT 0;

-- Add comment explaining the fields
COMMENT ON COLUMN parameters.fine_type IS 'Type of late fee: porcentaje (percentage of common expense), fijo (fixed amount), uf (UF amount)';
COMMENT ON COLUMN parameters.fine_fixed_amount IS 'Fixed amount for late fee when fine_type is fijo';
COMMENT ON COLUMN parameters.fine_uf_amount IS 'UF amount for late fee when fine_type is uf';
