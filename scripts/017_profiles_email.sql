-- Ensure houses table has required columns for owner registration
ALTER TABLE houses ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);
ALTER TABLE houses ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(20);

-- Ensure profiles table has email column for owner validation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_houses_owner_email ON houses(owner_email);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_house_id ON profiles(house_id);
