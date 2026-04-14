-- Script para recuperar usuarios en estado "limbo" sin condominio asignado
-- Usa este script manualmente para asignar un condominio a usuarios sin condominio

-- Ver usuarios sin condominio
SELECT id, email, first_name, condo_id, house_id, created_at 
FROM profiles 
WHERE condo_id IS NULL OR house_id IS NULL
ORDER BY created_at DESC;

-- Opción 1: Asignar un usuario específico (publicidad@dmsinnova.cl) a un condominio
-- Primero: Ver condominios disponibles
SELECT id, name FROM condominiums LIMIT 10;

-- Luego: Asignar el usuario a una propiedad (reemplaza los valores XXX)
-- Ejemplo: El usuario publicidad@dmsinnova.cl a la casa 1 del condominio 1
UPDATE profiles 
SET 
  condo_id = 'CONDO_ID_AQUI',
  house_id = 'HOUSE_ID_AQUI'
WHERE email = 'publicidad@dmsinnova.cl';

-- Verificar la actualización
SELECT id, email, first_name, condo_id, house_id 
FROM profiles 
WHERE email = 'publicidad@dmsinnova.cl';

-- Opción 2: Asignar por ID de usuario
-- UPDATE profiles 
-- SET 
--   condo_id = 'CONDO_ID',
--   house_id = 'HOUSE_ID'
-- WHERE id = 'USER_ID';

-- Opción 3: Auto-asignar todos los usuarios sin condominio a la primera casa de su email
-- (Solo si sus emails coinciden con owner_email en la tabla houses)
UPDATE profiles p
SET 
  condo_id = h.condo_id,
  house_id = h.id
FROM houses h
WHERE p.condo_id IS NULL 
  AND p.email = h.owner_email
  AND NOT EXISTS (
    SELECT 1 FROM profiles p2 
    WHERE p2.id = p.id AND p2.condo_id IS NOT NULL
  );
