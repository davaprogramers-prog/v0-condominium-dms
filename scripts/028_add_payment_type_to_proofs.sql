-- Add payment_type and fines_amount columns to payment_proofs table

ALTER TABLE payment_proofs 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'gastos_comunes';

ALTER TABLE payment_proofs 
ADD COLUMN IF NOT EXISTS fines_amount DECIMAL(12, 2) DEFAULT 0;

-- Add check constraint for payment_type
ALTER TABLE payment_proofs 
DROP CONSTRAINT IF EXISTS payment_proofs_payment_type_check;

ALTER TABLE payment_proofs 
ADD CONSTRAINT payment_proofs_payment_type_check 
CHECK (payment_type IN ('gastos_comunes', 'multas'));
