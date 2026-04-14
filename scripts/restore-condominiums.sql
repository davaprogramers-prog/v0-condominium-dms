-- Script para restaurar los 2 condominios borrados
-- Ejecutar en Supabase SQL Editor

-- Restaurar los 2 condominios (usando solo columnas que existen)
INSERT INTO condominiums (name, address, total_houses, currency_symbol, admin_user_id)
VALUES 
  ('El Canelo', 'Dirección de El Canelo', 1, '$', (SELECT id FROM auth.users WHERE email = 'davaprogramers@gmail.com' LIMIT 1)),
  ('Condominio Test', 'Dirección de Condominio Test', 1, '$', (SELECT id FROM auth.users WHERE email = 'davaprogramers@gmail.com' LIMIT 1));

-- Verificar que los condominios fueron insertados
SELECT id, name, address, total_houses, currency_symbol FROM condominiums ORDER BY created_at DESC LIMIT 2;
