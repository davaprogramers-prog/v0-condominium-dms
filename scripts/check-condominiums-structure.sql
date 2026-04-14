-- First, check actual structure of condominiums table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'condominiums' 
ORDER BY ordinal_position;
