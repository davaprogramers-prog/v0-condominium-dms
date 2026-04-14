-- Script para restaurar los 2 condominios borrados
-- Ejecutar en Supabase SQL Editor

-- 1. Obtener el ID del super admin (davaprogramers@gmail.com)
-- Nota: Reemplaza 'SUPER_ADMIN_ID' con el ID real si es diferente

-- 2. Restaurar los 2 condominios
INSERT INTO condominiums (name, address, total_houses, currency_symbol, currency_name, currency_multiplier, admin_user_id)
VALUES 
  ('El Canelo', 'Dirección de El Canelo', 1, '$', 'Peso', 1, (SELECT id FROM auth.users WHERE email = 'davaprogramers@gmail.com' LIMIT 1)),
  ('Condominio Test', 'Dirección de Condominio Test', 1, '$', 'Peso', 1, (SELECT id FROM auth.users WHERE email = 'davaprogramers@gmail.com' LIMIT 1))
ON CONFLICT DO NOTHING;

-- 3. Verificar que los condominios fueron insertados
SELECT id, name, address, total_houses, currency_symbol FROM condominiums ORDER BY created_at DESC LIMIT 2;
