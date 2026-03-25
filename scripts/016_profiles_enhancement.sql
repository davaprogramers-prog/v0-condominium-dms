-- Add email field to profiles for easier reference
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add house_id reference for owners
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS house_id UUID REFERENCES houses(id) ON DELETE SET NULL;

-- Update existing profiles to have email from auth.users
UPDATE profiles p
SET email = (SELECT email FROM auth.users WHERE id = p.id)
WHERE email IS NULL;
