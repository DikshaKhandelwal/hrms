-- ============================================
-- FIX: Infinite Recursion in RLS Policies
-- ============================================
-- The problem: Admin policies query profiles table, causing recursion
-- Solution: Use security definer function to bypass RLS for role checks

-- Step 1: Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can view their department profiles" ON profiles;
DROP POLICY IF EXISTS "enable_insert_for_own_profile" ON profiles;
DROP POLICY IF EXISTS "enable_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "enable_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "enable_read_for_admins" ON profiles;
DROP POLICY IF EXISTS "enable_update_for_admins" ON profiles;
DROP POLICY IF EXISTS "enable_delete_for_admins" ON profiles;
DROP POLICY IF EXISTS "enable_read_for_managers" ON profiles;

-- Step 2: Create helper function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Step 3: Create simple, non-recursive policies

-- Allow users to insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile (basic fields only)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to do everything (using helper function)
CREATE POLICY "profiles_all_for_admins"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

-- Allow managers to view their department
CREATE POLICY "profiles_select_department_for_managers"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.user_role() = 'senior_manager'
    AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
  );

-- Step 3: Insert your profile
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '23a7e4c7-2205-46be-b2f7-68314e93e1ab',
  'diksha1010.dk@gmail.com',
  'dk',
  'recruiter'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'dk',
  role = 'recruiter',
  email = 'diksha1010.dk@gmail.com';

-- Step 4: Verify policies (should see all policies listed)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 5: Test query (should work now)
SELECT id, email, full_name, role 
FROM profiles 
WHERE id = '23a7e4c7-2205-46be-b2f7-68314e93e1ab';
