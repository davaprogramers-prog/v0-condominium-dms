-- Fix the foreign key constraint in profiles table
-- First, let's check if the constraint exists and what it references

-- Drop the problematic foreign key constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Recreate the constraint as DEFERRABLE so it can be validated at transaction end
ALTER TABLE profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) 
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;
