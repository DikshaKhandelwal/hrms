-- ============================================
-- ABSOLUTE EMERGENCY FIX
-- ============================================
-- This will temporarily disable RLS to fix your profile
-- Then re-enable with correct policies

-- Step 1: DISABLE RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Ensure your profile exists
INSERT INTO profiles (id, email, full_name, role, phone, job_title, address, emergency_contact)
VALUES (
  '23a7e4c7-2205-46be-b2f7-68314e93e1ab',
  'diksha1010.dk@gmail.com',
  'Diksha Khandelwal',
  'recruiter',  -- Keep original recruiter role
  '',
  'HR Recruiter',
  '',
  ''
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Diksha Khandelwal',
  role = 'recruiter',
  email = 'diksha1010.dk@gmail.com',
  job_title = 'HR Recruiter';

-- Verify profile was created
SELECT 'Profile created/updated:' as status, id, email, full_name, role 
FROM profiles 
WHERE id = '23a7e4c7-2205-46be-b2f7-68314e93e1ab';

-- Step 3: Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
    END LOOP;
END $$;

-- Step 4: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create SIMPLE policies (no recursion)
-- These policies do NOT reference the profiles table in their conditions

-- Users can always see their own profile (CRITICAL!)
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Step 6: Add admin access using helper function
-- This prevents infinite recursion

-- Create helper function to get user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1
$$;

-- Admin can see all profiles
CREATE POLICY "profiles_admin_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- Admin can update all profiles
CREATE POLICY "profiles_admin_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Admin can insert any profile
CREATE POLICY "profiles_admin_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() = 'admin');

-- Admin can delete profiles
CREATE POLICY "profiles_admin_delete"
  ON profiles FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- Step 7: Verify everything
SELECT 
  'Verification Results' as section,
  'Policies Count' as check_type,
  COUNT(*)::text as result
FROM pg_policies 
WHERE tablename = 'profiles'
UNION ALL
SELECT 
  'Verification Results' as section,
  'Your Profile' as check_type,
  (SELECT full_name || ' (' || role || ')' FROM profiles WHERE id = '23a7e4c7-2205-46be-b2f7-68314e93e1ab')
UNION ALL
SELECT 
  'Verification Results' as section,
  'RLS Status' as check_type,
  CASE WHEN relrowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END
FROM pg_class WHERE relname = 'profiles';

-- ============================================
-- IMPORTANT: After running this
-- ============================================
-- 1. Refresh your browser (Ctrl + Shift + R)
-- 2. Log out and log back in
-- 3. Your profile should load immediately
-- ============================================
