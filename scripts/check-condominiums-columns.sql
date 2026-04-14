-- Verificar la estructura actual de la tabla condominiums
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'condominiums' 
ORDER BY ordinal_position;
