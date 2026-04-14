-- Delete all auth.users EXCEPT davaprogramers@gmail.com
-- ADVERTENCIA: Esta operación es irreversible. Asegúrate de tener un backup.

DELETE FROM auth.users 
WHERE email != 'davaprogramers@gmail.com';

-- Verificar que solo queda el usuario especificado
SELECT id, email FROM auth.users;
