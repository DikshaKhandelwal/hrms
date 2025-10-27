-- ============================================
-- SIMPLE FIX - No Helper Functions Needed
-- ============================================
-- This is the simplest approach that works without recursion

-- Step 1: Drop ALL existing policies
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
DROP POLICY IF EXISTS "profiles_select_for_managers" ON profiles;

-- Step 2: Create simple policies (users can only access their own data)
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

CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Step 3: Create your profile
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

-- Step 4: Install trigger for future users
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

-- Step 5: Verify
SELECT 
  'Policies Created' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT 
  'Trigger Created' as status,
  trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

SELECT 
  'Profile Created' as status,
  id,
  email,
  full_name,
  role
FROM profiles
WHERE id = '23a7e4c7-2205-46be-b2f7-68314e93e1ab';
