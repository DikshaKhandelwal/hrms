-- Fix: Add missing INSERT policy for profiles table
-- This allows authenticated users to create their own profile during sign-up
-- Run this in Supabase SQL Editor if you've already applied the original migration

-- Drop and recreate the policy to ensure it's correct
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
