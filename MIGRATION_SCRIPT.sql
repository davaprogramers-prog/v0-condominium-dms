-- Script de migración para agregar columnas faltantes a la tabla 'profiles'
-- Ejecuta este script en tu base de datos Supabase

-- Agregar columna 'email' a profiles si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Agregar columna 'phone' a profiles si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Crear índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Crear índice para búsquedas rápidas por house_id
CREATE INDEX IF NOT EXISTS idx_profiles_house_id ON profiles(house_id);
