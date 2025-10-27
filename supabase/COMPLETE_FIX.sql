-- ============================================
-- COMPLETE FIX - Run This Entire Script
-- ============================================
-- This fixes:
-- 1. Infinite recursion in RLS policies
-- 2. Missing profile for your user
-- 3. Trigger for future users

-- ============================================
-- PART 1: Fix RLS Policies (Stop Infinite Recursion)
-- ============================================

-- Drop ALL existing policies
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
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_all_for_admins" ON profiles;
DROP POLICY IF EXISTS "profiles_select_department_for_managers" ON profiles;

-- Create helper function to safely check user role (in public schema)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id LIMIT 1
$$;

-- Simple policies using the helper function
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_all_for_admins"
  ON profiles FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "profiles_select_for_managers"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'senior_manager'
    AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================
-- PART 2: Create Your Profile
-- ============================================

INSERT INTO profiles (id, email, full_name, role, phone, job_title, address, emergency_contact)
VALUES (
  '23a7e4c7-2205-46be-b2f7-68314e93e1ab',
  'diksha1010.dk@gmail.com',
  'dk',
  'recruiter',
  '',
  'HR Recruiter',
  '',
  ''
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'dk',
  role = 'recruiter',
  email = 'diksha1010.dk@gmail.com',
  job_title = 'HR Recruiter';

-- ============================================
-- PART 3: Install Trigger for Future Users
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 4: Verify Everything Works
-- ============================================

-- Check policies
SELECT 
  '✅ RLS Policies' as component,
  COUNT(*) as count,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check trigger
SELECT 
  '✅ Trigger' as component,
  COUNT(*) as count,
  string_agg(trigger_name, ', ') as trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check your profile
SELECT 
  '✅ Your Profile' as component,
  id,
  email,
  full_name,
  role
FROM profiles
WHERE id = '23a7e4c7-2205-46be-b2f7-68314e93e1ab';

-- Summary
SELECT '🎉 Setup Complete!' as status;
