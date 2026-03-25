-- Add email column to profiles table if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create index on house_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_house_id ON profiles(house_id);
