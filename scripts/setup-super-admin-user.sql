-- Script para asegurar que davaprogramers@gmail.com es super_admin
-- Ejecuta esto en Supabase SQL Editor

-- Primero, verificar si el usuario existe en auth
SELECT id, email FROM auth.users WHERE email = 'davaprogramers@gmail.com';

-- Luego, actualizar o crear el profile con rol super_admin
-- Reemplaza 'USER_ID_AQUI' con el ID del usuario anterior
UPDATE profiles 
SET role = 'super_admin', condo_id = NULL 
WHERE email = 'davaprogramers@gmail.com' OR id = 'USER_ID_AQUI';

-- Si no existe el profile, insertarlo (reemplaza USER_ID_AQUI)
INSERT INTO profiles (id, email, role, first_name, last_name)
VALUES ('USER_ID_AQUI', 'davaprogramers@gmail.com', 'super_admin', 'Davaprogramadores', 'Admin')
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin', condo_id = NULL;

-- Verificar que el cambio fue aplicado
SELECT id, email, role, condo_id FROM profiles WHERE email = 'davaprogramers@gmail.com';
